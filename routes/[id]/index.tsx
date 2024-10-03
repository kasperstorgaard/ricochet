import { useSignal } from "@preact/signals";
import Board from "#/islands/board.tsx";
import { Puzzle } from "#/db/types.ts";
import { Handlers, PageProps } from "$fresh/server.ts";

export const handler: Handlers<Puzzle> = {
  async GET(req, ctx) {
    const id = ctx.params.id;

    const apiUrl = new URL(req.url);
    apiUrl.pathname = `api/puzzles/${id}`;

    const response = await fetch(apiUrl);
    const puzzle = await response.json() as Puzzle | null;

    if (!puzzle) {
      return ctx.renderNotFound();
    }

    return ctx.render(puzzle);
  },
};

export default function PuzzleDetails(props: PageProps<Puzzle>) {
  const board = useSignal(props.data.board);

  return (
    <div class="flex flex-col col-[2/3] w-full gap-2 py-1">
      <Board state={board} />
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
