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
  GET(ctx) {
    const secret = ctx.url.searchParams.get("secret");
    const migrateSecret = Deno.env.get("MIGRATE_SECRET");

    if (!migrateSecret || secret !== migrateSecret) {
      return new Response("Unauthorized", { status: 401 });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const log = (msg: string) => {
          controller.enqueue(encoder.encode(msg + "\n"));
        };

        log(
          "Starting migration: backfill solutions_by_user from completed list",
        );

        let usersWithCompleted = 0;
        let usersSkipped = 0;
        let entriesSkipped = 0;
        let entriesWritten = 0;
        let entriesNoGroup = 0;

        // Scan all ["user", *, "completed"] entries
        const completedIter = kv.list<string[]>({ prefix: ["user"] });

        for await (const entry of completedIter) {
          // Key shape: ["user", userId, "completed"]
          const key = entry.key;
          if (key.length !== 3 || key[2] !== "completed") continue;

          const userId = key[1] as string;
          const slugs = entry.value;

          if (!Array.isArray(slugs) || slugs.length === 0) {
            usersSkipped++;
            continue;
          }

          usersWithCompleted++;
          log(`\nUser ${userId}: ${slugs.length} completed slugs`);

          // Try to find the user's own name from any existing indexed solution
          let userName: string | undefined;
          const existingUserIter = kv.list<Solution>(
            { prefix: ["solutions_by_user", userId] },
            { limit: 1 },
          );
          for await (const res of existingUserIter) {
            userName = res.value.name;
            break;
          }

          if (userName) {
            log(`  name: "${userName}" (from existing solution)`);
          } else {
            userName = "anon";
            log(`  name: not found, will use "anon"`);
          }

          for (const slug of slugs) {
            // Check if this user already has a solution for this puzzle
            const existingIter = kv.list<Solution>(
              { prefix: ["solutions_by_user_puzzle", userId, slug] },
              { limit: 1 },
            );

            let hasExisting = false;
            for await (const _ of existingIter) {
              hasExisting = true;
              break;
            }

            if (hasExisting) {
              entriesSkipped++;
              log(`  ${slug}: already indexed, skipping`);
              continue;
            }

            // Fetch the optimal (fewest moves) canonical group
            const groups = await listCanonicalGroups(slug, { limit: 1 });
            if (groups.length === 0) {
              entriesNoGroup++;
              log(`  ${slug}: no canonical groups found, skipping`);
              continue;
            }

            const canonical = groups[0].firstSolution;
            const name = userName ?? canonical.name;
            const userSolution: Solution = { ...canonical, userId, name };

            const byUserKey = ["solutions_by_user", userId, canonical.id];
            const byUserPuzzleKey = [
              "solutions_by_user_puzzle",
              userId,
              slug,
              canonical.id,
            ];

            await kv.atomic()
              .set(byUserKey, userSolution)
              .set(byUserPuzzleKey, userSolution)
              .commit();

            entriesWritten++;
            log(
              `  ${slug}: wrote solution ${canonical.id} (${canonical.moves.length} moves, name: "${name}")`,
            );
          }
        }

        log(`\nDone.`);
        log(`  Users with completed list: ${usersWithCompleted}`);
        log(`  Users skipped (empty list): ${usersSkipped}`);
        log(`  Entries skipped (already indexed): ${entriesSkipped}`);
        log(`  Entries with no canonical group: ${entriesNoGroup}`);
        log(`  Entries written: ${entriesWritten}`);

        controller.close();
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  },
});
