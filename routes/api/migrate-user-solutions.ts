import { define } from "#/core.ts";
import { kv } from "#/db/kv.ts";
import { Solution } from "#/db/types.ts";

/**
 * GET /api/migrate-user-solutions?secret=<MIGRATE_SECRET>
 *
 * Backfills solutions_by_user / solutions_by_user_puzzle indexes by matching
 * solution names (case-insensitive) to known users.
 *
 * Pass 1: scan solutions_by_user to build a lowercase-name → userId map.
 *         Collisions (two users sharing a name) are logged and the name is
 *         excluded from attribution to avoid mis-crediting.
 * Pass 2: scan all solutions_by_puzzle entries; for any solution whose name
 *         matches a known user (unambiguously) and isn't already indexed,
 *         write it in. Solutions that already carry a different userId are
 *         skipped — they belong to someone else.
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

        log("Starting migration: backfill solutions_by_user by name matching");

        // --- Pass 1: build lowercase-name → userId map ---
        log("\nPass 1: scanning solutions_by_user for known users...");

        const nameToUserId = new Map<string, string>();
        const collisions = new Set<string>();

        const userIter = kv.list<Solution>({ prefix: ["solutions_by_user"] });
        for await (const entry of userIter) {
          const { userId, name } = entry.value;
          if (!userId) continue;
          const key = name.toLowerCase();
          if (key === "anon") continue;

          const existing = nameToUserId.get(key);
          if (existing && existing !== userId) {
            collisions.add(key);
            log(
              `  COLLISION: "${key}" matches both ${existing} and ${userId} — will skip`,
            );
          } else {
            nameToUserId.set(key, userId);
          }
        }

        // Remove colliding names so they aren't mis-attributed
        for (const name of collisions) nameToUserId.delete(name);

        log(`\n  ${nameToUserId.size} unambiguous users:`);
        for (const [name, userId] of nameToUserId) {
          log(`    "${name}" → ${userId}`);
        }
        if (collisions.size > 0) {
          log(`  ${collisions.size} ambiguous name(s) excluded from attribution`);
        }

        // --- Pass 2: scan all puzzle solutions and attribute by name ---
        log("\nPass 2: scanning solutions_by_puzzle...");

        let checked = 0;
        let skippedNoUser = 0;
        let skippedWrongUserId = 0;
        let skippedAlreadyIndexed = 0;
        let written = 0;

        const puzzleIter = kv.list<Solution>({ prefix: ["solutions_by_puzzle"] });

        for await (const entry of puzzleIter) {
          const solution = entry.value;
          checked++;

          const lowerName = solution.name.toLowerCase();
          if (lowerName === "anon") {
            skippedNoUser++;
            continue;
          }

          const userId = nameToUserId.get(lowerName);
          if (!userId) {
            skippedNoUser++;
            continue;
          }

          // Skip solutions already attributed to a different user — they're
          // not a name match gone wrong, they belong to someone else.
          if (solution.userId && solution.userId !== userId) {
            skippedWrongUserId++;
            log(
              `  SKIP: ${solution.puzzleSlug}/${solution.id} has userId ${solution.userId}, name matches ${userId}`,
            );
            continue;
          }

          // Check if this user already has any solution for this puzzle
          const existingIter = kv.list<Solution>(
            { prefix: ["solutions_by_user_puzzle", userId, solution.puzzleSlug] },
            { limit: 1 },
          );

          let hasExisting = false;
          for await (const _ of existingIter) {
            hasExisting = true;
            break;
          }

          if (hasExisting) {
            skippedAlreadyIndexed++;
            continue;
          }

          const userSolution: Solution = { ...solution, userId };
          const byUserKey = ["solutions_by_user", userId, solution.id];
          const byUserPuzzleKey = [
            "solutions_by_user_puzzle",
            userId,
            solution.puzzleSlug,
            solution.id,
          ];

          await kv.atomic()
            .set(byUserKey, userSolution)
            .set(byUserPuzzleKey, userSolution)
            .commit();

          written++;
          log(
            `  ${solution.puzzleSlug}: wrote ${solution.id} for "${solution.name}" → ${userId} (${solution.moves.length} moves)`,
          );
        }

        log(`\nDone.`);
        log(`  Solutions checked: ${checked}`);
        log(`  Skipped (no matching user): ${skippedNoUser}`);
        log(`  Skipped (attributed to different userId): ${skippedWrongUserId}`);
        log(`  Skipped (already indexed): ${skippedAlreadyIndexed}`);
        log(`  Written: ${written}`);

        controller.close();
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  },
});
