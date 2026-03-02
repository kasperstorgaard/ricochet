import { ulid } from "@std/ulid";

import { Solution, Solve } from "#/db/types.ts";
import { encodeMoves } from "#/game/strings.ts";
import { Move } from "#/game/types.ts";

export const kv = await Deno.openKv();

export async function addSolution(payload: Omit<Solution, "id">) {
  const { puzzleSlug, moves } = payload;
  const noOfMoves = moves.length;

  const id = ulid().toLowerCase();
  const solution = { ...payload, id };

  // simple key by slug for easy direct lookup
  const primaryKey = ["solutions_by_puzzle", puzzleSlug, id];

  // key for listing by moves, for scoreboard
  const byMovesKey = ["solutions_by_puzzle_moves", puzzleSlug, noOfMoves, id];

  await kv.atomic()
    .check({ key: primaryKey, versionstamp: null })
    .check({ key: byMovesKey, versionstamp: null })
    .set(primaryKey, solution)
    .set(byMovesKey, solution)
    .commit();

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

export async function listPuzzleSolutions(
  puzzleSlug: string,
  options: ListPuzzleSolutionsOptions,
) {
  const solutions: Solution[] = [];
  const { limit, byMoves } = options;

  if (!limit) {
    throw new Error("Must provide a limit");
  }

  const key = byMoves
    ? ["solutions_by_puzzle_moves", puzzleSlug]
    : ["solutions_by_puzzle", puzzleSlug];

  const iter = kv.list<Solution>({ prefix: key }, options);

  for await (const res of iter) solutions.push(res.value);

  return solutions;
}

export async function getPuzzleSolution(
  puzzleSlug: string,
  solutionId: string,
) {
  const key = ["solutions_by_puzzle", puzzleSlug, solutionId];
  const res = await kv.get<Solution>(key);

  return res.value;
}

export async function addSolve(payload: Omit<Solve, "id" | "name">) {
  const { puzzleSlug, moves } = payload;

  const id = ulid().toLowerCase();
  const solution = { ...payload, id };

  const movesEncoded = encodeMoves(moves);

  const primaryKey = ["solves_by_puzzle", id];

  // key for listing solutions by sequence, for hints
  // note: this will store the entire solution to reference by each move
  const bySequenceKey = [
    "solves_by_puzzle_move_sequence",
    puzzleSlug,
    ...movesEncoded.split("-"),
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

export async function listPuzzleSolves(
  puzzleSlug: string,
  options: ListPuzzleSolvesOptions,
) {
  const solves: Solve[] = [];
  const { limit, bySequence } = options;

  if (!limit) {
    throw new Error("Must provide a limit");
  }

  let key: string[];

  if (bySequence) {
    const encodedMoves = encodeMoves(bySequence);
    key = [
      "solves_by_puzzle_move_sequence",
      puzzleSlug,
      ...encodedMoves.split("-"),
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

export async function getPuzzleSolve(
  puzzleSlug: string,
  solutionId: string,
) {
  const key = ["solves_by_puzzle", puzzleSlug, solutionId];
  const res = await kv.get<Solve>(key);

  return res.value;
}
