import { define } from "#/core.ts";
import { getOnboardingCookie } from "#/game/cookies.ts";

/**
 * Middleware that reads the onboarding cookie and sets ctx.state.onboarding.
 */
export const onboarding = define.middleware(async (ctx) => {
  ctx.state.onboarding = getOnboardingCookie(ctx.req.headers);
  return await ctx.next();
});
