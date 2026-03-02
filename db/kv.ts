import { ulid } from "@std/ulid";

import { Solution } from "#/db/types.ts";
import { encodeMoves } from "#/game/strings.ts";
import { Move } from "#/game/types.ts";

export const kv = await Deno.openKv();

export async function addSolution(payload: Omit<Solution, "id">) {
  const { puzzleSlug, moves } = payload;
  const noOfMoves = moves.length;

  const id = ulid().toLowerCase();
  const solution = { ...payload, id };

  const movesEncoded = encodeMoves(moves);

  // simple key by slug for easy direct lookup
  const primaryKey = ["solutions_by_puzzle", puzzleSlug, id];

  // key for listing by moves, for scoreboard
  const byMovesKey = ["solutions_by_puzzle_moves", puzzleSlug, noOfMoves, id];

  // key for listing solutions by sequence, for hints
  // note: this will store the entire solution to reference by each move
  const bySequenceKey = [
    "solutions_by_puzzle_move_sequence",
    puzzleSlug,
    ...movesEncoded.split("-"),
    id,
  ];

  await kv.atomic()
    .check({ key: primaryKey, versionstamp: null })
    .check({ key: byMovesKey, versionstamp: null })
    .check({ key: bySequenceKey, versionstamp: null })
    .set(primaryKey, solution)
    .set(byMovesKey, solution)
    .set(bySequenceKey, solution)
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
  puzzleId: string,
  options: ListPuzzleSolutionsOptions,
) {
  const solutions: Solution[] = [];
  const {
    byMoves,
    bySequence,
    filters = { generated: false },
    limit,
    ...kvOptions
  } = options;

  let key: Deno.KvKey;

  if (!limit) {
    throw new Error("Must provide a limit");
  }

  if (bySequence !== undefined) {
    const encodedMoves = encodeMoves(bySequence);
    key = [
      "solutions_by_puzzle_move_sequence",
      puzzleId,
      ...encodedMoves.split("-"),
    ];
  } else if (byMoves) {
    key = ["solutions_by_puzzle_moves", puzzleId];
  } else {
    key = ["solutions_by_puzzle", puzzleId];
  }

  const iter = kv.list<Solution>({ prefix: key }, kvOptions);

  for await (const res of iter) {
    if (
      filters.generated !== "both" &&
      Boolean(filters.generated) !== Boolean(res.value.isGenerated)
    ) continue;

    solutions.push(res.value);

    if (solutions.length >= limit) break;
  }

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
