import { Move, PuzzleStats } from "#/game/types.ts";

export type { PuzzleStats };

// Human entered solution for a puzzle
export type Solution = {
  id: string;
  puzzleSlug: string;
  name: string;
  moves: Move[];
  userId?: string;
};

// One entry per canonical move group for a puzzle, maintained as best-effort aggregate
export type CanonicalGroup = {
  canonicalKey: string;
  firstSolution: Solution;
  count: number;
};

// Machine generated solve for a puzzle
export type Solve = {
  id: string;
  puzzleSlug: string;
  moves: Move[];
};
