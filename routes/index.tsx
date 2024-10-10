import { Handlers } from "$fresh/server.ts";
import { listPuzzles } from "#/db/kv.ts";

export const handler: Handlers = {
  async GET(req) {
    const puzzles = await listPuzzles();

    const redirectUrl = new URL(req.url);
    redirectUrl.pathname = puzzles[0].id;

    return Response.redirect(redirectUrl);
  },
};

export default function Home() {
  return <div>redirect</div>;
}

/**
 * Game state:
 * - game of the day decided by timezone, changes at midnight
 * - 1 url part for the moves of the pieces
 *
 * Ideas:
 * - when the page is refreshed/shown, replay the moves. The more moves the faster (capped)
 * - replay button
 * - store moves in session
 * - require auth for editor
 * - add "disable animations" button, for the fast players
 * - send game state changes sequence to server, and let the piece "catch up" slower, even if the user is 2-3 steps ahead.
 * - redirect to game id of the day when landing on home
 * - board state is not all in the url, only pieces
 * - the piece moves are stored client side in a session or idb
 * - the moves are validated on the server
 * - add a tutorial, which plays out moves on an interval in front of you interval played out in front of you,
 *   but can be undo/redo'ed to make you understand
 * - add a keyboard navigation hint for desktop
 * - add a touch navigation hint for mobile
 * - ripple fade in of board and pieces, from the outside in, or top to bottom
 * - can't get enough, buy the boardgame (ask for forgiveness, not permission)
 * - undo/redo is just history navigation (is this a good thing even?)
 * - use 2 digit hex to store piece state, eg. 7_0 is 07, 1_2 is 09, 1_5 is 0C etc.
 */
