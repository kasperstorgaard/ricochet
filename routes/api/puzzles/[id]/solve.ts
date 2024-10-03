import { Handlers } from "$fresh/server.ts";
import { addSolution, getPuzzle } from "#/db/kv.ts";
import { Move, Solution } from "#/db/types.ts";
import { isGameWon, resolveMoves } from "#/util/board.ts";

type Payload = {
  name: string;
  moves: Move[];
};

export const handler: Handlers<Solution | null> = {
  async POST(req, ctx) {
    const id = ctx.params.id;

    const puzzle = await getPuzzle(id);
    if (!puzzle) throw new Error("Invalid puzzle id");

    const { moves, name } = await req.json() as Payload;
    if (!moves?.length) throw new Error("Invalid list of moves");

    const board = resolveMoves(puzzle.board, moves);
    const isWon = isGameWon(board);

    if (isWon) {
      const solution = await addSolution({
        puzzleId: id,
        moves,
        name,
      });
      return new Response(JSON.stringify(solution));
    }

    return new Response(JSON.stringify(null));
  },
};
