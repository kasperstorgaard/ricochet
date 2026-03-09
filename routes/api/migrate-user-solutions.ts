import { define } from "#/core.ts";
import { kv } from "#/db/kv.ts";
import { listCanonicalGroups } from "#/db/solutions.ts";
import { Solution } from "#/db/types.ts";

/**
 * GET /api/migrate-user-solutions?secret=<MIGRATE_SECRET>
 *
 * Backfills solutions_by_user / solutions_by_user_puzzle indexes for users
 * who only have the old `["user", userId, "completed"]` slug list.
 *
 * For each (userId, slug) pair without an existing user-puzzle solution entry:
 * picks the optimal canonical group's firstSolution and writes it into the
 * user's solution indexes. This is "optimistic credit" — we can't know
 * which exact solution the user submitted before per-user indexing existed.
 *
 * DELETE this route after confirming migration output.
 */
export const handler = define.handlers({
  async GET(ctx) {
    const secret = ctx.url.searchParams.get("secret");
    const migrateSecret = Deno.env.get("MIGRATE_SECRET");

    if (!migrateSecret || secret !== migrateSecret) {
      return new Response("Unauthorized", { status: 401 });
    }

    const lines: string[] = [];
    const log = (msg: string) => {
      lines.push(msg);
      console.log(msg);
    };

    log("Starting migration: backfill solutions_by_user from completed list");

    // Scan all ["user", *, "completed"] entries
    const completedIter = kv.list<string[]>({ prefix: ["user"] });

    let usersScanned = 0;
    let usersWithCompleted = 0;
    let entriesSkipped = 0;
    let entriesWritten = 0;
    let entriesNoGroup = 0;

    for await (const entry of completedIter) {
      // Key shape: ["user", userId, "completed"]
      const key = entry.key;
      if (key.length !== 3 || key[2] !== "completed") continue;

      const userId = key[1] as string;
      const slugs = entry.value;

      if (!Array.isArray(slugs) || slugs.length === 0) continue;

      usersScanned++;
      usersWithCompleted++;
      log(`User ${userId}: ${slugs.length} completed slugs`);

      for (const slug of slugs) {
        // Check if this user already has solutions for this puzzle
        const existingIter = kv.list<Solution>({
          prefix: ["solutions_by_user_puzzle", userId, slug],
        }, { limit: 1 });

        let hasExisting = false;
        for await (const _ of existingIter) {
          hasExisting = true;
          break;
        }

        if (hasExisting) {
          entriesSkipped++;
          log(`  ${slug}: already has user-puzzle entry, skipping`);
          continue;
        }

        // Fetch the optimal (fewest moves) canonical group
        const groups = await listCanonicalGroups(slug, { limit: 1 });
        if (groups.length === 0) {
          entriesNoGroup++;
          log(`  ${slug}: no canonical groups found, skipping`);
          continue;
        }

        const solution = groups[0].firstSolution;
        const solutionId = solution.id;

        // Write into user indexes with the userId patched in
        const userSolution: Solution = { ...solution, userId };
        const byUserKey = ["solutions_by_user", userId, solutionId];
        const byUserPuzzleKey = [
          "solutions_by_user_puzzle",
          userId,
          slug,
          solutionId,
        ];

        await kv.atomic()
          .set(byUserKey, userSolution)
          .set(byUserPuzzleKey, userSolution)
          .commit();

        entriesWritten++;
        log(
          `  ${slug}: wrote solution ${solutionId} (${solution.moves.length} moves)`,
        );
      }
    }

    log(`\nDone.`);
    log(`  Users scanned: ${usersScanned}`);
    log(`  Users with completed list: ${usersWithCompleted}`);
    log(`  Entries skipped (already indexed): ${entriesSkipped}`);
    log(`  Entries with no canonical group: ${entriesNoGroup}`);
    log(`  Entries written: ${entriesWritten}`);

    return new Response(lines.join("\n"), {
      headers: { "Content-Type": "text/plain" },
    });
  },
});
