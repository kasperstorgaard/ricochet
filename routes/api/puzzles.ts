import { define } from "#/core.ts";
import { isDev } from "#/lib/env.ts";

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

    const { slug, markdown } = await ctx.req.json();

    if (!slug || !markdown) {
      return new Response("Missing slug, name or markdown", { status: 400 });
    }

    await Deno.writeTextFile(`${PUZZLES_DIR}/${slug}.md`, markdown);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  },
});
