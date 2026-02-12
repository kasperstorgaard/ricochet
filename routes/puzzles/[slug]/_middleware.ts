import { define } from "#/core.ts";
import { getDifficultyBadgeFlag } from "../../../lib/feature-flags.ts";

const middleware = define.middleware(async (ctx) => {
  ctx.state.featureFlags.difficultyBadge = await getDifficultyBadgeFlag(
    ctx.state,
  );

  return await ctx.next();
});

export default [middleware];
