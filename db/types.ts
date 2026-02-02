import { Move } from "../util/types.ts";

export type Solution = {
  id: string;
  puzzleSlug: string;
  name: string;
  moves: Move[];
};
