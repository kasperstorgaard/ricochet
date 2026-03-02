import { Move } from "#/game/types.ts";

export type Solution = {
  id: string;
  puzzleSlug: string;
  name: string;
  moves: Move[];
  isGenerated?: boolean;
};
