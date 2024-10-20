import { Puzzle, Solution } from "./types.ts";
import { ulid } from "jsr:@std/ulid";

export const kv = await Deno.openKv("./.sqlite/db");

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
  await kv.atomic()
    .set(["puzzles", id], data)
    .commit();

  return data;
}

export async function deletePuzzle(id: string) {
  await kv.atomic().delete(["puzzles", id]).commit();
}

export async function listPuzzles(options?: Deno.KvListOptions) {
  const iter = kv.list<Puzzle>({ prefix: ["puzzles"] }, {
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
  const { puzzleId } = payload;
  const noOfMoves = payload.moves.length;
  const id = ulid();
  const solution = { ...payload, id };

  const primaryKey = ["puzzles", puzzleId, "solutions", id];
  const byMovesKey = ["puzzles", puzzleId, "solutions_by_moves", noOfMoves, id];

  await kv.atomic()
    .check({ key: primaryKey, versionstamp: null })
    .check({ key: byMovesKey, versionstamp: null })
    .set(primaryKey, solution)
    .set(byMovesKey, solution)
    .commit();

  return solution;
}

export async function listSolutions(
  puzzleId: string,
  options: Deno.KvListOptions = {
    limit: 10,
  },
) {
  const solutions: Solution[] = [];

  const iter = kv.list<Solution>({
    prefix: ["puzzles", puzzleId, "solutions"],
  }, options);

  for await (const res of iter) solutions.push(res.value);

  return solutions;
}

export async function listSolutionsByMoves(
  puzzleId: string,
  options: Deno.KvListOptions = {
    limit: 10,
  },
) {
  const solutions: Solution[] = [];
  const byMovesKey = ["puzzles", puzzleId, "solutions_by_moves"];

  const iter = kv.list<Solution>({ prefix: byMovesKey }, options);
  for await (const res of iter) solutions.push(res.value);

  return solutions;
}

export async function getSolution(
  puzzleId: string,
  solutionId: string,
) {
  const key = ["puzzles", puzzleId, "solutions", solutionId];
  const res = await kv.get<Solution>(key);

  return res.value;
}
