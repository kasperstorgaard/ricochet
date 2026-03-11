import { define } from "#/core.ts";
import { getUser, setUser } from "#/db/user.ts";
import { tracer } from "#/lib/telemetry.ts";

/**
 * Reads the user record from KV in a single call and populates
 * ctx.state.theme, ctx.state.user.onboarding, and ctx.state.email.
 * Requires auth middleware to run first.
 */
export const user = define.middleware((ctx) => {
  const url = new URL(ctx.req.url);

  // Skip migrations, or we get a catch-22
  if (url.pathname.startsWith("/api/migrate")) return ctx.next();

  return tracer.startActiveSpan("middleware.user", async (span) => {
    try {
      const user = await tracer.startActiveSpan(
        "kv.getUser",
        async (s) => {
          try {
            return await getUser(ctx.state.userId);
          } finally {
            s.end();
          }
        },
      );

      if (user) {
        ctx.state.user = user;
      } else {
        await setUser(ctx.state.userId, { onboarding: "new" });
        ctx.state.user = { id: ctx.state.userId, onboarding: "new" };
      }

      return await ctx.next();
    } catch (err) {
      span.recordException(err as Error);
      throw err;
    } finally {
      span.end();
    }
  });
});
