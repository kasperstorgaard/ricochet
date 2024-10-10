import { Puzzle, Solution } from "./types.ts";
import { ulid } from "jsr:@std/ulid";

export const kv = await Deno.openKv("./.sqlite/db");

type ListOptions = {
  limit?: number;
  page?: number;
};

export async function createPuzzle(data: Omit<Puzzle, "id">) {
  const id = ulid();
  const puzzle: Puzzle = { id, ...data };

  await kv.atomic().set(["puzzles", id], puzzle).commit();

  return puzzle;
}

export async function getPuzzle(id: string) {
  const puzzle = await kv.get<Puzzle>(["puzzles", id]);
  return puzzle.value;
}

export async function setPuzzle(id: string, data: Puzzle) {
  await kv.atomic()
    .set(["puzzles", id], data).commit();
  return data;
}

export async function deletePuzzle(id: string) {
  await kv.atomic().delete(["puzzles", id]).commit();
}

export async function listPuzzles(options?: ListOptions) {
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
  const noOfMoves = payload.moves.length;
  const id = ulid();

  const solution = {
    ...payload,
    id,
  };

  await kv.atomic().set(
    ["puzzles", solution.puzzleId, "solutions", noOfMoves, id],
    solution,
  ).commit();

  return solution;
}

type GetSolutionsOptions = {
  limit?: number;
};

export async function getSolutions(
  puzzleId: string,
  options?: GetSolutionsOptions,
) {
  const solutions: Solution[] = [];

  const iter = kv.list<Solution>({
    prefix: ["puzzles", puzzleId, "solutions"],
  });

  for await (const res of iter) {
    solutions.push(res.value);
    if (solutions.length >= (options?.limit ?? 10)) break;
  }

  return solutions;
}

export async function getSolution(
  puzzleId: string,
  solutionId: string,
) {
  const res = await kv.get<Solution>([
    "puzzles",
    puzzleId,
    "solutions",
    solutionId,
  ]);
  return res.value;
}

export async function getSolutionRank(
  puzzleId: string,
  solutionId: string,
) {
  const iter = kv.list<Solution>({
    prefix: ["puzzles", puzzleId, "solutions"],
    end: ["puzzles", puzzleId, "solutions", solutionId],
  }, {
    batchSize: 500,
  });

  let counter = 0;
  for await (const _res of iter) {
    counter++;
  }

  return counter;
}

// export async function pushMove(puzzleId: string, move: Move) {
//   const moves = await kv.get<Move[]>(["puzzles", puzzleId, "moves"]);

//   const updatedMoves = moves.value ?? [];
//   updatedMoves.push(move);

//   await kv.atomic().check(moves).set(
//     ["puzzles", puzzleId, "moves"],
//     updatedMoves,
//   ).commit();

//   return updatedMoves;
// }

// export async function popMove(puzzleId: string) {
//   const moves = await kv.get<Move[]>(["puzzles", puzzleId, "moves"]);

//   const updatedMoves = (moves.value ?? []).slice();
//   updatedMoves.pop();

//   await kv.atomic().check(moves).set(
//     ["puzzles", puzzleId, "moves"],
//     updatedMoves,
//   ).commit();

//   return updatedMoves;
// }

// export async function getMoves(puzzleId: string) {
//   const moves = await kv.get<Move[]>(["puzzles", puzzleId, "moves"]);
//   return moves.value;
// }
