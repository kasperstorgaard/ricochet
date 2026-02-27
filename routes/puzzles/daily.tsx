import { define } from "#/core.ts";
import { getPuzzleOfTheDay } from "#/game/loader.ts";
import { getDifficulty } from "#/game/url.ts";

// Redirect route to get the daily puzzle
export const handler = define.handlers({
  async GET(ctx) {
    const req = ctx.req;
    const redirectUrl = new URL(req.url);

    const difficulty = getDifficulty(req.url) ?? ["easy", "medium"];

    const today = new Date(Date.now());
    // Don't include the toughest puzzles in puzzle of the day
    const puzzle = await getPuzzleOfTheDay(ctx.url.origin, today, {
      difficulty,
    });

    redirectUrl.pathname = `puzzles/${puzzle.slug}`;
    return Response.redirect(redirectUrl);
  },
});
