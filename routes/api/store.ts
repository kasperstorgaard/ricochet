import { define } from "#/core.ts";
import { Puzzle } from "#/game/types.ts";
import { setStoredPuzzleCookie } from "#/game/cookies.ts";
import { parsePuzzle } from "#/game/parser.ts";

type Payload = {
  // markdown content to store
  markdown: string;
};

// POST endpoint for storing a puzzle in cookies (either new or existing)
export const handler = define.handlers({
  async POST(ctx) {
    let body: Payload;

    try {
      body = await ctx.req.json();
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    const { markdown } = body;

    if (!markdown) {
      return new Response("Invalid options", { status: 400 });
    }

    let puzzle: Puzzle;

    try {
      puzzle = parsePuzzle(markdown);
    } catch {
      return new Response("Invalid puzzle", { status: 400 });
    }

    const headers = new Headers();
    setStoredPuzzleCookie(headers, puzzle);

    return new Response("OK", { headers, status: 200 });
  },
});
