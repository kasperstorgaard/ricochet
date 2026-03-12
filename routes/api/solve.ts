import { define } from "#/core.ts";
import { validateBoard } from "#/game/board.ts";
import { solveSync } from "#/game/solver.ts";
import type { Board } from "#/game/types.ts";

// POST endpoint that returns a solve for the board, if possible.
// Used by the puzzle editor — does not persist results.
export const handler = define.handlers({
  async POST(ctx) {
    let board: Board;

    try {
      board = await ctx.req.json();
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    try {
      validateBoard(board);
    } catch {
      return new Response("Invalid Board", { status: 400 });
    }

    try {
      const solution = solveSync(board, { maxDepth: 20 });
      return Response.json({ moves: solution });
    } catch {
      return new Response("Unsolvable", { status: 400 });
    }
  },
});
