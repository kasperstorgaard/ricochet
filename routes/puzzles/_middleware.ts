import { define } from "#/core.ts";
import { getMinMovesFlag } from "#/lib/feature-flags.ts";

const middleware = define.middleware(async (ctx) => {
  ctx.state.featureFlags = {
    minMoves: await getMinMovesFlag(ctx.state),
  };

  return await ctx.next();
});

export default [middleware];
