import { Puzzle, Solution } from "./types.ts";
import { ulid } from "jsr:@std/ulid";
import { slug } from "jsr:@annervisser/slug";

export const kv = await Deno.openKv();

export async function createPuzzle(data: Omit<Puzzle, "id" | "slug">) {
  const id = ulid();
  const puzzleSlug = slug(`${data.name}-${id.slice(id.length - 20)}`);

  const puzzle: Puzzle = { id, slug: puzzleSlug, ...data };

  const primaryKey = ["puzzles", id];
  const bySlugKey = ["puzzles_by_slug", puzzleSlug];

  await kv.atomic()
    .check({ key: primaryKey, versionstamp: null })
    .check({ key: bySlugKey, versionstamp: null })
    .set(primaryKey, puzzle)
    .set(bySlugKey, puzzle)
    .commit();

  return puzzle;
}

export async function getPuzzle(idOrSlug: string) {
  const primaryKey = ["puzzles", idOrSlug];
  const bySlugKey = ["puzzles_by_slug", idOrSlug];

  const puzzles = await kv.getMany<Puzzle[]>([primaryKey, bySlugKey]);

  for (const puzzle of puzzles) {
    if (puzzle.value) return puzzle.value;
  }

  return null;
}

export async function deletePuzzle(idOrSlug: string) {
  const primaryKey = ["puzzles", idOrSlug];
  const bySlugKey = ["puzzles_by_slug", idOrSlug];

  await kv.atomic()
    .delete(primaryKey)
    .delete(bySlugKey)
    .commit();
}

type ListPuzzlesOptions = Deno.KvListOptions & {
  bySlug?: boolean;
};

export async function listPuzzles(options?: ListPuzzlesOptions) {
  const key = options?.bySlug ? ["puzzles_by_slug"] : ["puzzles"];

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
  puzzleId: string,
  solutionId: string,
) {
  const key = ["solutions_by_puzzle", puzzleId, solutionId];
  const res = await kv.get<Solution>(key);

  return res.value;
}
