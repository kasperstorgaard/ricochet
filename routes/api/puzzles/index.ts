import { Handlers } from "$fresh/server.ts";
import { Board, Puzzle } from "#/db/types.ts";
import { validateBoard } from "#/util/board.ts";
import { createPuzzle, listPuzzles } from "#/db/kv.ts";

type Data = Board & {
  id: string;
};

export const handler: Handlers<Data> = {
  async GET(_req, _ctx) {
    const puzzles = await listPuzzles({ limit: 10 });
    return new Response(JSON.stringify(puzzles));
  },
  async POST(req) {
    const data = await req.json() as Omit<Puzzle, "id">;

    if (!data?.board || !validateBoard(data.board)) {
      throw new Error("Invalid puzzle board state");
    }

    const puzzle = await createPuzzle(data);
    return new Response(JSON.stringify(puzzle));
  },
};
