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
      let user = await tracer.startActiveSpan(
        "kv.getUser",
        async (span) => {
          try {
            return await getUser(ctx.state.userId);
          } finally {
            span.end();
          }
        },
      );

      if (user) {
        ctx.state.user = user;
      } else {
        user = { id: ctx.state.userId, onboarding: "new", theme: "skub" };
        await setUser(ctx.state.userId, user);
        ctx.state.user = user;
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
