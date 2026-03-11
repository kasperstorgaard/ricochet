import { define } from "#/core.ts";
import { getUserOnboarding } from "#/db/user.ts";
import { tracer } from "#/lib/telemetry.ts";

/**
 * Middleware that reads the onboarding state from KV and sets ctx.state.onboarding.
 * Requires user middleware to run first.
 */
export const onboarding = define.middleware((ctx) =>
  tracer.startActiveSpan("middleware.onboarding", async (span) => {
    try {
      ctx.state.onboarding = await tracer.startActiveSpan(
        "kv.getUserOnboarding",
        async (span) => {
          try {
            return await getUserOnboarding(ctx.state.userId);
          } finally {
            span.end();
          }
        },
      );

      return await ctx.next();
    } catch (err) {
      span.recordException(err as Error);
      throw err;
    } finally {
      span.end();
    }
  })
);
