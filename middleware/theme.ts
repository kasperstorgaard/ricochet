import { define } from "#/core.ts";
import { getThemeCookie } from "#/game/cookies.ts";

export const theme = define.middleware(async (ctx) => {
  ctx.state.theme = getThemeCookie(ctx.req.headers) ?? "skub";

  return await ctx.next();
});
