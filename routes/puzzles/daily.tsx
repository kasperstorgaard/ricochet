import { define } from "#/core.ts";
import { getLatestPuzzle } from "#/game/loader.ts";

// Redirect route to get the daily puzzle
export const handler = define.handlers({
  async GET(ctx) {
    const req = ctx.req;
    const redirectUrl = new URL(req.url);

    // Don't include the toughest puzzles in puzzle of the day
    const puzzle = await getLatestPuzzle(ctx.url.origin);

    redirectUrl.pathname = `puzzles/${puzzle.slug}`;
    return Response.redirect(redirectUrl, 303);
  },
});
