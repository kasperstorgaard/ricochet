import { define } from "#/core.ts";

const PUZZLES_DIR = "./static/puzzles";

/**
 * Localhost-only API for saving puzzles to static files.
 * Useful when building and editing puzzles.
 */
export const handler = define.handlers({
  async POST(ctx) {
    const hostname = ctx.url.hostname;
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      return new Response("Forbidden", { status: 403 });
    }

    const { markdown, slug } = await ctx.req.json();
    if (!markdown || !slug) {
      return new Response("Missing markdown or slug", { status: 400 });
    }

    await Deno.writeTextFile(`${PUZZLES_DIR}/${slug}.md`, markdown);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  },
});
