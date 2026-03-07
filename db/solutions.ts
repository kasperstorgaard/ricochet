import { ulid } from "@std/ulid";

import { kv } from "#/db/kv.ts";
import { updatePuzzleStats } from "#/db/stats.ts";
import { Solution, Solve } from "#/db/types.ts";
import { encodeMoves } from "#/game/strings.ts";
import { Move } from "#/game/types.ts";

/**
 * Stores a human-submitted solution under three index keys (plus two user-scoped keys when userId is present):
 * - by puzzle slug (direct lookup)
 * - by puzzle slug + move count (scoreboard ordering)
 * - by puzzle slug + move sequence (deduplication / stats)
 * - by user (user history)
 * - by user + puzzle slug (user's attempts at a specific puzzle)
 *
 * Uses an atomic transaction so all entries are written together or not at all.
 *
 * Note: aggregates (total solutions, move distribution) are maintained separately in
 * db/stats.ts as best-effort — see updatePuzzleStats.
 */
export async function addSolution(payload: Omit<Solution, "id">) {
  const { puzzleSlug, moves } = payload;
  const noOfMoves = moves.length;

  const id = ulid().toLowerCase();
  const solution = { ...payload, id };

  // simple key by slug for easy direct lookup
  const primaryKey = ["solutions_by_puzzle", puzzleSlug, id];

  // key for listing by moves, for scoreboard
  const byMovesKey = ["solutions_by_puzzle_moves", puzzleSlug, noOfMoves, id];

  // key for listing by sequence, for stats
  const bySequenceKey = [
    "solutions_by_puzzle_sequence",
    puzzleSlug,
    ...getSequenceKey(moves),
    id,
  ];

  // publicly available keys
  const atomic = kv.atomic()
    .check({ key: primaryKey, versionstamp: null })
    .check({ key: byMovesKey, versionstamp: null })
    .check({ key: bySequenceKey, versionstamp: null })
    .set(primaryKey, solution)
    .set(byMovesKey, solution)
    .set(bySequenceKey, solution);

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

  // Best-effort — does not block the response, may drift slightly
  updatePuzzleStats(puzzleSlug, moves.length, payload.userId).catch(() => {});

  return solution;
}

type ListPuzzleSolutionsOptions = Omit<Deno.KvListOptions, "limit"> & {
  limit: number;
  byMoves?: boolean;
  bySequence?: Move[];
  filters?: {
    generated: boolean | "both";
  };
};

/**
 * Lists human-submitted solutions for a puzzle.
 *
 * Pass `byMoves: true` to order results by move count (scoreboard).
 * Pass `bySequence` with a move list to filter to solutions that share that
 * exact move sequence (useful for duplicate checks or getting stats on exact solution matches).
 * Without either option, results are returned in insertion order.
 *
 * `limit` is required.
 */
export async function listPuzzleSolutions(
  puzzleSlug: string,
  options: ListPuzzleSolutionsOptions,
) {
  const solutions: Solution[] = [];
  const { limit, byMoves, bySequence } = options;

  if (!limit) throw new Error("Must provide a limit");

  let key: string[];

  if (byMoves) {
    key = ["solutions_by_puzzle_moves", puzzleSlug];
  } else if (bySequence) {
    key = [
      "solutions_by_puzzle_sequence",
      puzzleSlug,
      ...getSequenceKey(bySequence),
    ];
  } else {
    key = ["solutions_by_puzzle", puzzleSlug];
  }

  const iter = kv.list<Solution>({ prefix: key }, options);

  for await (const res of iter) solutions.push(res.value);

  return solutions;
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
    key = [
      "solves_by_puzzle",
    ];
  }

  const iter = kv.list<Solution>({ prefix: key }, options);

  for await (const res of iter) solves.push(res.value);

  return solves;
}

/** Fetches a single machine-generated solve by puzzle slug and solve ID. Returns `null` if not found. */
export async function getPuzzleSolve(
  puzzleSlug: string,
  solutionId: string,
) {
  const key = ["solves_by_puzzle", puzzleSlug, solutionId];
  const res = await kv.get<Solve>(key);

  return res.value;
}

function getSequenceKey(moves: Move[]) {
  const encoded = encodeMoves(moves);
  return encoded.split("-");
}
