import { useSignal } from "@preact/signals";
import Board from "../islands/board.tsx";
import { Piece, Position, Wall } from "../util/board.ts";

export default function Home() {
  const destination = useSignal<Position>({ x: 2, y: 5 });

  const walls = useSignal<Wall[]>([
    { x: 3, y: 7, orientation: "horizontal" },
    { x: 3, y: 4, orientation: "horizontal" },
    { x: 6, y: 6, orientation: "vertical" },
  ]);

  const pieces = useSignal<Piece[]>([
    { x: 3, y: 6, type: "rook" },
    { x: 3, y: 4, type: "bouncer" },
    { x: 3, y: 2, type: "bouncer" },
    { x: 0, y: 6, type: "bouncer" },
  ]);

  return (
    <div class="p-3 bg-gray-10">
      <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center">
        <Board
          cols={7}
          rows={11}
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
