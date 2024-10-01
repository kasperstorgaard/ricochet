import { Handlers } from "$fresh/server.ts";
import { BoardState } from "../../../util/board.ts";

type Data = BoardState & {
  id: string;
};

export const handler: Handlers<Data> = {
  GET(_req, ctx) {
    const board: BoardState = {
      destination: { x: 2, y: 5 },
      pieces: [
        { x: 3, y: 6, type: "rook" },
        { x: 3, y: 4, type: "bouncer" },
        { x: 3, y: 2, type: "bouncer" },
        { x: 0, y: 6, type: "bouncer" },
      ],
      walls: [
        { x: 3, y: 7, orientation: "horizontal" },
        { x: 3, y: 4, orientation: "horizontal" },
        { x: 6, y: 6, orientation: "vertical" },
      ],
    };

    return ctx.render({
      id: "1234",
      ...board,
    });
  },
};
