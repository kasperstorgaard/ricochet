import { useSignal } from "@preact/signals";
import Board from "../islands/board.tsx";
import { BoardState, Piece, Position, Wall } from "../util/board.ts";
import { parseBoard, stringifyBoard } from "../util/url.ts";
import { PageProps } from "$fresh/server.ts";

// TODO: move to db/session
const initialState: BoardState = {
  cols: 7,
  rows: 11,
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

export default function Home(props: PageProps) {
  const url = props.url;
  if (!props.url.search) {
    url.search = stringifyBoard(initialState);
  }

  const state = parseBoard(url.search);

  const href = useSignal<string>(url.toString());
  const cols = useSignal<number>(state.cols);
  const rows = useSignal<number>(state.rows);
  const destination = useSignal<Position>(state.destination);
  const walls = useSignal<Wall[]>(state.walls);
  const pieces = useSignal<Piece[]>(state.pieces);

  return (
    <div class="flex flex-col place-items-center p-3 bg-gray-10">
      <div class="max-w-screen-md">
        <Board
          href={href}
          cols={cols}
          rows={rows}
          destination={destination}
          walls={walls}
          pieces={pieces}
        />
      </div>
    </div>
  );
}

/**
 * Game state:
 * - game of the day decided by timezone, changes at midnight
 * - 1 url part for the moves of the pieces
 * - update game state (url) after each animation is finished
 * - add revert functionality (history back?)
 * - add reset functionality
 * - active piece or blocker is temporary state, not url state
 *
 * Ideas:
 * - when the page is refreshed/shown, replay the moves. The more moves the faster (capped)
 * - add active/hover potential paths when clicking a piece
 * - start of simple by click interactions, not swiping
 * - enlarge valid click target
 * - replay button
 * - add "disable animations" button, for the fast players
 * - send game state changes sequence to server, and let the piece "catch up" slower, even if the user is 2-3 steps ahead.
 * - redirect to game id of the day when landing on home
 */
