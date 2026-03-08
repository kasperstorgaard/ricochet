/**
 * One-time migration: backfill solutions_by_puzzle_canonical and
 * solution_groups_by_puzzle for all existing solutions.
 *
 * Safe to re-run — uses atomic checks to skip already-migrated entries.
 *
 * Usage: deno run -A scripts/migrate-canonical.ts
 */

import { kv } from "#/db/kv.ts";
import { CanonicalGroup, Solution } from "#/db/types.ts";
import { getCanonicalMoveKey } from "#/game/strings.ts";

let migrated = 0;
let skipped = 0;
let failed = 0;

const iter = kv.list<Solution>({ prefix: ["solutions_by_puzzle"] });

for await (const entry of iter) {
  const solution = entry.value;
  const canonicalKey = getCanonicalMoveKey(solution.moves);

  const byCanonicalKey = [
    "solutions_by_puzzle_canonical",
    solution.puzzleSlug,
    canonicalKey,
    solution.id,
  ];

  const groupKey = [
    "solution_groups_by_puzzle",
    solution.puzzleSlug,
    solution.moves.length,
    canonicalKey,
  ];

  // Write canonical index (skip if already exists)
  const existing = await kv.get(byCanonicalKey);
  const isNew = !existing.value;
  if (isNew) {
    await kv.set(byCanonicalKey, solution);
  }

  // Update group aggregate with retry — only when this canonical entry is new,
  // so re-runs don't double-count already migrated solutions.
  if (!isNew) {
    skipped++;
    continue;
  }

  let groupUpdated = false;
  for (let attempt = 1; attempt <= 5; attempt++) {
    const current = await kv.get<CanonicalGroup>(groupKey);
    const updated: CanonicalGroup = current.value
      ? { ...current.value, count: current.value.count + 1 }
      : { canonicalKey, firstSolution: solution, count: 1 };

    const result = await kv.atomic().check(current).set(groupKey, updated)
      .commit();
    if (result.ok) {
      groupUpdated = true;
      break;
    }
  }

  if (groupUpdated) {
    migrated++;
  } else {
    console.error(`Failed to update group for solution ${solution.id}`);
    failed++;
  }
}

console.log(`Done. migrated=${migrated} skipped=${skipped} failed=${failed}`);
