import { define } from "#/core.ts";
import { isDev } from "#/lib/env.ts";
import { updateManifest } from "#/lib/manifest.ts";
import { parsePuzzle } from "../../util/parser.ts";
import { solve } from "../../util/solver.ts";
import { formatPuzzle } from "../../util/formatter.ts";

const PUZZLES_DIR = "./static/puzzles";

/**
 * Localhost-only API for saving puzzles to static files.
 * Useful when building and editing puzzles.
 */
export const handler = define.handlers({
  async POST(ctx) {
    if (!isDev) {
      return new Response("Forbidden", { status: 403 });
    }

    let { slug, markdown } = await ctx.req.json();

    if (!slug || !markdown) {
      return new Response("Missing slug, name or markdown", { status: 400 });
    }

    try {
      const puzzle = parsePuzzle(markdown);
      const moves = solve(puzzle);

      markdown = formatPuzzle({
        ...puzzle,
        difficulty: moves?.length,
      });

      await Deno.writeTextFile(`${PUZZLES_DIR}/${slug}.md`, markdown);
      await updateManifest();

      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response((err as Error).message, { status: 400 });
    }
  },
});
