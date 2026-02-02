import { ulid } from "@std/ulid";
import { Solution } from "./types.ts";

export const kv = await Deno.openKv();

export async function addSolution(payload: Omit<Solution, "id">) {
  const { puzzleSlug, moves } = payload;
  const noOfMoves = moves.length;

  const id = ulid().toLowerCase();
  const solution = { ...payload, id };

  const primaryKey = ["solutions_by_puzzle", puzzleSlug, id];
  const byMovesKey = ["solutions_by_puzzle_moves", puzzleSlug, noOfMoves, id];

  await kv.atomic()
    .check({ key: primaryKey, versionstamp: null })
    .check({ key: byMovesKey, versionstamp: null })
    .set(primaryKey, solution)
    .set(byMovesKey, solution)
    .commit();

  return solution;
}

type ListPuzzleSolutionsOptions = Deno.KvListOptions & {
  byMoves?: boolean;
};

export async function listPuzzleSolutions(
  puzzleId: string,
  options: ListPuzzleSolutionsOptions,
) {
  const solutions: Solution[] = [];

  const key = options?.byMoves
    ? ["solutions_by_puzzle_moves", puzzleId]
    : ["solutions_by_puzzle", puzzleId];

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
