import { Puzzle } from "#/db/types.ts";
import { Handlers, PageProps } from "$fresh/server.ts";

export const handler: Handlers<Puzzle[]> = {
  async GET(req, ctx) {
    const apiUrl = new URL(req.url);
    apiUrl.pathname = "api/puzzles";

    const response = await fetch(apiUrl);
    const puzzles = await response.json() as Puzzle[];
    return ctx.render(puzzles);
  },
};

export default function Home(props: PageProps<Puzzle[]>) {
  return (
    <div class="flex flex-col col-[2/3] w-full gap-fl-2 py-1">
      <h1 className="text-fl-2">Recent puzzles</h1>

      <ul className="grid gap-3">
        {props.data.filter((item) => item.id).map((puzzle) => (
          <li className="flex gap-2 pl-0">
            <a href={`/${puzzle.id}`} className="underline">
              {puzzle.name}
            </a>
            <a
              href={`/editor/${puzzle.id}`}
              className="underline px-2 rounded-3 border-1 border-purple-2 text-purple-4"
            >
              edit
            </a>
          </li>
        ))}
      </ul>
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
