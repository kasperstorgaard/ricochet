import { ulid } from "@std/ulid";

import { kv } from "#/db/kv.ts";
import { updatePuzzleStats } from "#/db/stats.ts";
import { CanonicalGroup, Solution, Solve } from "#/db/types.ts";
import { encodeMoves, getCanonicalMoveKey } from "#/game/strings.ts";
import { Move } from "#/game/types.ts";

/**
 * Stores a human-submitted solution under two index keys (plus two user-scoped keys when userId is present):
 * - by puzzle slug (direct lookup)
 * - by puzzle slug + canonical move key (order-independent, for dedup)
 * - by user (user history)
 * - by user + puzzle slug (user's attempts at a specific puzzle)
 *
 * Uses an atomic transaction so all entries are written together or not at all.
 * Awaits aggregate updates (stats, canonical group) before returning — errors are logged but not re-thrown.
 */
export async function addSolution(payload: Omit<Solution, "id">) {
  const { puzzleSlug, moves } = payload;

  const id = ulid().toLowerCase();
  const solution = { ...payload, id };

  // simple key by slug for easy direct lookup
  const primaryKey = ["solutions_by_puzzle", puzzleSlug, id];

  // key for listing by canonical move set (order-independent), for dedup and panel expansion
  const byCanonicalKey = [
    "solutions_by_puzzle_canonical",
    puzzleSlug,
    getCanonicalMoveKey(moves),
    id,
  ];

  // publicly available keys
  const atomic = kv.atomic()
    .check({ key: primaryKey, versionstamp: null })
    .check({ key: byCanonicalKey, versionstamp: null })
    .set(primaryKey, solution)
    .set(byCanonicalKey, solution);

  // user-scoped keys
  if (payload.userId) {
    const byUserKey = ["solutions_by_user", payload.userId, id];
    const byUserPuzzleKey = [
      "solutions_by_user_puzzle",
      payload.userId,
      puzzleSlug,
      id,
    ];
    atomic
      .check({ key: byUserKey, versionstamp: null })
      .check({ key: byUserPuzzleKey, versionstamp: null })
      .set(byUserKey, solution)
      .set(byUserPuzzleKey, solution);
  }

  await atomic.commit();

  try {
    await Promise.all([
      updatePuzzleStats(puzzleSlug, moves.length, payload.userId),
      updateCanonicalGroup(puzzleSlug, moves, solution),
    ]);
  } catch (err) {
    console.error("Failed to update solution aggregates:", (err as Error).message);
  }

  return solution;
}

/**
 * Lists human-submitted solutions for a puzzle in insertion order.
 * `limit` is required.
 */
export async function listPuzzleSolutions(
  puzzleSlug: string,
  options: { limit: number } & Omit<Deno.KvListOptions, "limit">,
) {
  const solutions: Solution[] = [];
  if (!options.limit) throw new Error("Must provide a limit");

  const iter = kv.list<Solution>(
    { prefix: ["solutions_by_puzzle", puzzleSlug] },
    options,
  );

  for await (const res of iter) solutions.push(res.value);

  return solutions;
}

/**
 * Lists canonical groups for a puzzle, ordered by move count (fewest first).
 * Each entry represents a unique set of moves with a count of how many solutions share it.
 * `limit` is required.
 */
export async function listCanonicalGroups(
  puzzleSlug: string,
  options: { limit: number } & Omit<Deno.KvListOptions, "limit">,
) {
  const groups: CanonicalGroup[] = [];
  if (!options.limit) throw new Error("Must provide a limit");

  const iter = kv.list<CanonicalGroup>(
    { prefix: ["solution_groups_by_puzzle", puzzleSlug] },
    options,
  );

  for await (const res of iter) groups.push(res.value);

  return groups;
}

/**
 * Updates the canonical group aggregate for a puzzle after a new solution is added.
 * Creates the group entry if absent; increments count if present.
 * Retries up to 5 times on optimistic concurrency conflicts.
 */
async function updateCanonicalGroup(
  puzzleSlug: string,
  moves: Move[],
  solution: Solution,
): Promise<void> {
  const canonicalKey = getCanonicalMoveKey(moves);
  const key = [
    "solution_groups_by_puzzle",
    puzzleSlug,
    moves.length,
    canonicalKey,
  ];

  for (let attempt = 1; attempt <= 5; attempt++) {
    const current = await kv.get<CanonicalGroup>(key);

    const updated: CanonicalGroup = current.value
      ? { ...current.value, count: current.value.count + 1 }
      : { canonicalKey, firstSolution: solution, count: 1 };

    const result = await kv.atomic().check(current).set(key, updated).commit();
    if (result.ok) return;
  }

  throw new Error(`Failed to update canonical group after 5 attempts`);
}

/**
 * Lists all solutions submitted by a specific user, in insertion order.
 * `limit` is required.
 */
export async function listUserSolutions(
  userId: string,
  options: { limit: number } & Omit<Deno.KvListOptions, "limit">,
) {
  const solutions: Solution[] = [];
  if (!options.limit) throw new Error("Must provide a limit");

  const iter = kv.list<Solution>(
    { prefix: ["solutions_by_user", userId] },
    options,
  );

  for await (const res of iter) solutions.push(res.value);

  return solutions;
}

/**
 * Lists all solutions submitted by a specific user for a specific puzzle, in insertion order.
 * `limit` is required.
 */
export async function listUserPuzzleSolutions(
  userId: string,
  puzzleSlug: string,
  options: { limit: number } & Omit<Deno.KvListOptions, "limit">,
) {
  const solutions: Solution[] = [];
  if (!options.limit) throw new Error("Must provide a limit");

  const iter = kv.list<Solution>(
    { prefix: ["solutions_by_user_puzzle", userId, puzzleSlug] },
    options,
  );

  for await (const res of iter) solutions.push(res.value);

  return solutions;
}

/**
 * Fetches the canonical group for a given solution.
 * Returns `null` if not found.
 */
export async function getCanonicalGroup(
  solution: Solution,
): Promise<CanonicalGroup | null> {
  const canonicalKey = getCanonicalMoveKey(solution.moves);
  const key = [
    "solution_groups_by_puzzle",
    solution.puzzleSlug,
    solution.moves.length,
    canonicalKey,
  ];
  const res = await kv.get<CanonicalGroup>(key);
  return res.value;
}

/**
 * Fetches a single human-submitted solution by puzzle slug and solution ID.
 * Returns `null` if not found.
 */
export async function getPuzzleSolution(
  puzzleSlug: string,
  solutionId: string,
) {
  const key = ["solutions_by_puzzle", puzzleSlug, solutionId];
  const res = await kv.get<Solution>(key);

  return res.value;
}

/**
 * Checks whether a user already has a solution with the same canonical move set
 * for a given puzzle. Returns the existing solution or null.
 * Uses a list scan — fine since users post very few solutions per puzzle.
 */
export async function getCanonicalUserSolution(
  userId: string,
  puzzleSlug: string,
  moves: Move[],
): Promise<Solution | null> {
  const existing = await listUserPuzzleSolutions(userId, puzzleSlug, {
    limit: 100,
  });
  const canonicalKey = getCanonicalMoveKey(moves);
  return (
    existing.find((s) => getCanonicalMoveKey(s.moves) === canonicalKey) ?? null
  );
}

/**
 * Stores a machine-generated solve under two index keys:
 * - primary (by ID, for direct lookup)
 * - by puzzle slug + move sequence (for hints for a user who has partially made this solve)
 */
export async function addSolve(payload: Omit<Solve, "id" | "name">) {
  const { puzzleSlug, moves } = payload;

  const id = ulid().toLowerCase();
  const solution = { ...payload, id };

  const primaryKey = ["solves_by_puzzle", id];

  // key for listing solutions by sequence, for hints
  // note: this will store the entire solution to reference by each move
  const bySequenceKey = [
    "solves_by_puzzle_move_sequence",
    puzzleSlug,
    ...getSequenceKey(moves),
    id,
  ];

  await kv.atomic()
    .check({ key: primaryKey, versionstamp: null })
    .check({ key: bySequenceKey, versionstamp: null })
    .set(primaryKey, solution)
    .set(bySequenceKey, solution)
    .commit();

  return solution;
}

type ListPuzzleSolvesOptions = Omit<Deno.KvListOptions, "limit"> & {
  limit: number;
  bySequence?: Move[];
};

/**
 * Lists machine-generated solves.
 *
 * Pass `bySequence` with the moves the user has made so far to find solves matching sequence.
 * Without `bySequence`, lists all solves across all puzzles (primary index).
 *
 * `limit` is required.
 */
export async function listPuzzleSolves(
  puzzleSlug: string,
  options: ListPuzzleSolvesOptions,
) {
  const solves: Solve[] = [];
  const { limit, bySequence } = options;

  if (!limit) throw new Error("Must provide a limit");

  let key: string[];

  if (bySequence) {
    key = [
      "solves_by_puzzle_move_sequence",
      puzzleSlug,
      ...getSequenceKey(bySequence),
    ];
  } else {
    // TODO: `puzzleSlug` is ignored here — lists all solves globally, not per-puzzle.
    // The primary index key should include puzzleSlug: ["solves_by_puzzle", puzzleSlug].
    key = [
      "solves_by_puzzle",
    ];
  }

  // TODO: kv.list type param is wrong — should be `kv.list<Solve>`, not `kv.list<Solution>`
  const iter = kv.list<Solution>({ prefix: key }, options);

  for await (const res of iter) solves.push(res.value);

  return solves;
}

/** Fetches a single machine-generated solve by puzzle slug and solve ID. Returns `null` if not found. */
export async function getPuzzleSolve(
  puzzleSlug: string,
  solutionId: string,
) {
  // TODO: key is wrong — addSolve stores at ["solves_by_puzzle", id] (no puzzleSlug).
  // This lookup will never find anything. Fix by aligning the key in addSolve or here.
  const key = ["solves_by_puzzle", puzzleSlug, solutionId];
  const res = await kv.get<Solve>(key);

  return res.value;
}

function getSequenceKey(moves: Move[]) {
  const encoded = encodeMoves(moves);
  return encoded.split("-");
}
