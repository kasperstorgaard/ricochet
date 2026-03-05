import { define } from "#/core.ts";
import { setStoredPuzzleCookie } from "#/game/cookies.ts";
import { getPuzzle } from "#/game/loader.ts";
import { isDev } from "#/lib/env.ts";

// Redirect handler to create a new puzzle based on an existing one
export const handler = define.handlers({
  async GET(ctx) {
    const { slug } = ctx.params;

    const puzzle = await getPuzzle(ctx.url.origin, slug);
    if (!isDev) puzzle.name = "Untitled";

    puzzle.createdAt = new Date(Date.now());
    puzzle.minMoves = 0;

    const headers = new Headers();
    setStoredPuzzleCookie(headers, puzzle);

    headers.set("Location", "/puzzles/new");

    return new Response("", {
      headers,
      status: 303,
    });
  },
});
