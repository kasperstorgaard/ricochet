import { Puzzle, Solution } from "./types.ts";
import { ulid } from "jsr:@std/ulid";

export const kv = await Deno.openKv();

export async function createPuzzle(data: Omit<Puzzle, "id">) {
  const id = ulid();
  const puzzle: Puzzle = { id, ...data };

  const key = ["puzzles", id];

  await kv.atomic()
    .check({ key, versionstamp: null })
    .set(key, puzzle)
    .commit();

  return puzzle;
}

export async function getPuzzle(id: string) {
  const puzzle = await kv.get<Puzzle>(["puzzles", id]);
  return puzzle.value;
}

export async function setPuzzle(id: string, data: Puzzle) {
  const key = ["puzzles", id];

  await kv.atomic()
    .set(key, data)
    .commit();

  return data;
}

export async function deletePuzzle(id: string) {
  const key = ["puzzles", id];

  await kv.atomic()
    .delete(key)
    .commit();
}

export async function listPuzzles(options?: Deno.KvListOptions) {
  const key = ["puzzles"];

  const iter = kv.list<Puzzle>({ prefix: key }, {
    limit: options?.limit ?? 10,
    reverse: true,
  });

  const puzzles: Puzzle[] = [];

  for await (const res of iter) {
    puzzles.push(res.value);
  }

  return puzzles;
}

export async function addSolution(payload: Omit<Solution, "id">) {
  const { puzzleId, moves } = payload;
  const noOfMoves = moves.length;

  const id = ulid();
  const solution = { ...payload, id };

  const primaryKey = ["solutions_by_puzzle", puzzleId, id];
  const byMovesKey = ["solutions_by_puzzle_moves", puzzleId, noOfMoves, id];

  await kv.atomic()
    .check({ key: primaryKey, versionstamp: null })
    .check({ key: byMovesKey, versionstamp: null })
    .set(primaryKey, solution)
    .set(byMovesKey, solution)
    .commit();

  return solution;
}

export async function listPuzzleSolutions(
  puzzleId: string,
  options: Deno.KvListOptions = {
    limit: 10,
  },
) {
  const solutions: Solution[] = [];

  const key = ["solutions", puzzleId];

  const iter = kv.list<Solution>({ prefix: key }, options);

  for await (const res of iter) solutions.push(res.value);

  return solutions;
}

export async function listPuzzleSolutionsByMoves(
  puzzleId: string,
  options: Deno.KvListOptions = {
    limit: 10,
  },
) {
  const solutions: Solution[] = [];
  const byMovesKey = ["solutions_by_puzzle_moves", puzzleId];

  const iter = kv.list<Solution>({ prefix: byMovesKey }, options);
  for await (const res of iter) solutions.push(res.value);

  return solutions;
}

export async function getPuzzleSolution(
  puzzleId: string,
  solutionId: string,
) {
  const key = ["solutions_by_puzzle", puzzleId, solutionId];
  const res = await kv.get<Solution>(key);

  return res.value;
}
