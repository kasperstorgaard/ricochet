/**
 * One-off migration route: backfill solution_groups_by_puzzle from existing
 * solutions_by_puzzle_canonical entries.
 *
 * Protected by a secret token — pass ?secret=<MIGRATE_SECRET> in the URL.
 * Delete this file after the migration is confirmed complete.
 *
 * GET /api/migrate-canonical?secret=<MIGRATE_SECRET>
 */

import { define } from "#/core.ts";
import { kv } from "#/db/kv.ts";
import { CanonicalGroup, Solution } from "#/db/types.ts";
import { getCanonicalMoveKey } from "#/game/strings.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const secret = Deno.env.get("MIGRATE_SECRET");
    if (!secret || ctx.url.searchParams.get("secret") !== secret) {
      return new Response("Forbidden", { status: 403 });
    }

    const log: string[] = [];

    // --- Delete existing groups ---
    const groupIter = kv.list<CanonicalGroup>({
      prefix: ["solution_groups_by_puzzle"],
    });
    let deleted = 0;
    for await (const entry of groupIter) {
      await kv.delete(entry.key);
      deleted++;
    }
    log.push(`Deleted ${deleted} existing groups`);

    // --- Rebuild from canonical entries ---
    const canonicalIter = kv.list<Solution>({
      prefix: ["solutions_by_puzzle_canonical"],
    });

    let written = 0;
    let failed = 0;

    for await (const entry of canonicalIter) {
      const solution = entry.value;
      const canonicalKey = getCanonicalMoveKey(solution.moves);
      const groupKey = [
        "solution_groups_by_puzzle",
        solution.puzzleSlug,
        solution.moves.length,
        canonicalKey,
      ];

      let ok = false;
      for (let attempt = 1; attempt <= 5; attempt++) {
        const current = await kv.get<CanonicalGroup>(groupKey);
        const updated: CanonicalGroup = current.value
          ? { ...current.value, count: current.value.count + 1 }
          : { canonicalKey, firstSolution: solution, count: 1 };

        const result = await kv.atomic().check(current).set(groupKey, updated)
          .commit();
        if (result.ok) {
          ok = true;
          break;
        }
      }

      if (ok) {
        written++;
      } else {
        log.push(`Failed to update group for solution ${solution.id}`);
        failed++;
      }
    }

    log.push(`Groups written=${written} failed=${failed}`);

    return new Response(log.join("\n"), {
      headers: { "content-type": "text/plain" },
    });
  },
});
