import { define } from "#/core.ts";
import { setStoredPuzzleCookie } from "#/util/cookies.ts";
import { getPuzzle } from "#/util/loader.ts";

// Redirect handler to create a new puzzle based on an existing one
export const handler = define.handlers({
  async GET(ctx) {
    const { slug } = ctx.params;

    const puzzle = await getPuzzle(ctx.url.origin, slug);
    puzzle.name = "Untitled";

    const headers = new Headers();
    setStoredPuzzleCookie(headers, puzzle);

    headers.set("Location", "/puzzles/new");

    return new Response("", {
      headers,
      status: 302,
    });
  },
});
