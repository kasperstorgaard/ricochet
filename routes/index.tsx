import { useSignal } from "@preact/signals";
import Board from "../islands/board.tsx";
import { Wall } from "../util/board.ts";

export default function Home() {
  const active = useSignal({ x: 6, y: 8 });

  const walls = useSignal<Wall[]>([{
    x: 6,
    y: 4,
    orientation: "horizontal",
  }, {
    x: 6,
    y: 4,
    orientation: "vertical",
  }, {
    x: 2,
    y: 3,
    orientation: "horizontal",
  }, {
    x: 6,
    y: 1,
    orientation: "vertical",
  }, {
    x: 3,
    y: 4,
    orientation: "vertical",
  }]);

  return (
    <div class="p-3 bg-gray-10">
      <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center">
        <Board
          active={active}
          walls={walls}
          cols={7}
          rows={11}
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
 */
