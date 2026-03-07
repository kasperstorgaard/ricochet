import { Move } from "#/game/types.ts";

// Human entered solution for a puzzle
export type Solution = {
  id: string;
  puzzleSlug: string;
  name: string;
  moves: Move[];
  userId?: string;
};

// Machine generated solve for a puzzle
export type Solve = {
  id: string;
  puzzleSlug: string;
  moves: Move[];
};
