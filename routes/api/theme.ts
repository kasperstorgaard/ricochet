import { define } from "#/core.ts";
import { setThemeCookie } from "#/game/cookies.ts";

export const handler = define.handlers({
  async POST(ctx) {
    const form = await ctx.req.formData();
    const theme = form.get("theme")?.toString() ?? "";

    const returnTo = form.get("return_to")?.toString();
    const url = new URL(returnTo || ctx.req.referrer || ctx.url.origin);

    const headers = new Headers({
      Location: url.href,
    });

    setThemeCookie(headers, theme || null);

    return new Response("", {
      status: 303,
      headers,
    });
  },
});
