import { define } from "#/core.ts";
import { setUserTheme } from "#/db/user.ts";

export const handler = define.handlers({
  async POST(ctx) {
    const form = await ctx.req.formData();
    const theme = form.get("theme")?.toString() ?? "";

    const returnTo = form.get("return_to")?.toString();
    const url = new URL(returnTo || ctx.req.referrer || ctx.url.origin);

    await setUserTheme(ctx.state.userId, theme || null);

    return new Response("", {
      status: 303,
      headers: { Location: url.href },
    });
  },
});
