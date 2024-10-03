import { Handlers } from "$fresh/server.ts";
import { getPuzzle, setPuzzle } from "#/db/kv.ts";
import { Puzzle } from "#/db/types.ts";
import { validateBoard } from "#/util/board.ts";

export const handler: Handlers<Puzzle> = {
  async GET(_req, ctx) {
    const puzzle = await getPuzzle(ctx.params.id);
    return new Response(JSON.stringify(puzzle));
  },
  async POST(req, ctx) {
    const puzzle = await req.json() as Puzzle;

    if (!puzzle?.board || !validateBoard(puzzle.board)) {
      throw new Error("Invalid puzzle board state");
    }

    await setPuzzle(ctx.params.id, puzzle);
    return new Response(JSON.stringify(puzzle));
  },
};
