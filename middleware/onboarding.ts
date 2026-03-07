import { define } from "#/core.ts";
import { getUserOnboarding } from "#/db/user.ts";

/**
 * Middleware that reads the onboarding state from KV and sets ctx.state.onboarding.
 * Requires user middleware to run first.
 */
export const onboarding = define.middleware(async (ctx) => {
  ctx.state.onboarding = await getUserOnboarding(ctx.state.userId);
  return await ctx.next();
});
