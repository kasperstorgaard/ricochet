import { Puzzle } from "#/db/types.ts";
import { Handlers } from "$fresh/server.ts";
import { getPuzzle } from "#/db/kv.ts";
import { formatPuzzle } from "#/util/formatter.ts";

export const handler: Handlers<Puzzle> = {
  async GET(_req, ctx) {
    const { puzzleId } = ctx.params;

    const puzzle = await getPuzzle(puzzleId);
    if (!puzzle) throw new Error(`Unable to find puzzle with id: ${puzzleId}`);

    return new Response(formatPuzzle({
      ...puzzle,
      metadata: {
        name: puzzle.name,
      },
    }));
  },
};
