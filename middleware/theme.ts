import { define } from "#/core.ts";
import { getUserTheme } from "#/db/user.ts";
import { tracer } from "#/lib/telemetry.ts";

export const theme = define.middleware((ctx) =>
  tracer.startActiveSpan("middleware.theme", async (span) => {
    try {
      ctx.state.theme = (await getUserTheme(ctx.state.userId)) ?? "skub";
      return await ctx.next();
    } catch (err) {
      span.recordException(err as Error);
      throw err;
    } finally {
      span.end();
    }
  })
);
