import { define } from "#/core.ts";
import { setStoredPuzzleCookie } from "#/game/cookies.ts";
import { parsePuzzle } from "#/game/parser.ts";

// POST endpoint for importing a puzzle file (.md), storing it in cookies and redirecting to the editor
export const handler = define.handlers({
  async POST(ctx) {
    let form: FormData;

    try {
      form = await ctx.req.formData();
    } catch {
      return new Response("Invalid form data", { status: 400 });
    }

    const file = form.get("file");

    if (!(file instanceof File)) {
      return new Response("Missing file", { status: 400 });
    }

    const markdown = await file.text();

    try {
      const puzzle = parsePuzzle(markdown);
      const redirect = ctx.req.headers.get("Referer") ?? "/puzzles/new";
      const headers = new Headers();

      setStoredPuzzleCookie(headers, puzzle);
      headers.set("Location", redirect);

      return new Response(null, { headers, status: 303 });
    } catch {
      return new Response("Invalid puzzle file", { status: 400 });
    }
  },
});
