import { define } from "#/core.ts";
import { validateBoard } from "#/util/board.ts";
import { solve } from "#/util/solver.ts";
import type { Board } from "#/util/types.ts";

/** POST endpoint that returns the shortest solution length for a board. */
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
      const solution = solve(board, { maxDepth: 20 });

      return Response.json({
        moves: solution ? solution.length : null,
      });
    } catch {
      return new Response("Unsolvable", { status: 400 });
    }
  },
});
