import { define } from "#/core.ts";
import { getUserTheme } from "#/db/user.ts";

export const theme = define.middleware(async (ctx) => {
  ctx.state.theme = (await getUserTheme(ctx.state.userId)) ?? "skub";

  return await ctx.next();
});
