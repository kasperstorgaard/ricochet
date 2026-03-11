import { define } from "#/core.ts";
import { generateTrackingId, getTrackingCookie } from "#/game/cookies.ts";
import { tracer } from "#/lib/telemetry.ts";

/**
 * Middleware that evaluates tracking consent and captures pageviews.
 *
 * Sets ctx.state.cookieChoice and trackingId
 * based on the tracking_id cookie value.
 */
export const tracking = define.middleware((ctx) =>
  tracer.startActiveSpan("middleware.tracking", async (span) => {
    try {
      const trackingCookie = getTrackingCookie(ctx.req.headers);

      let cookieChoice: "accepted" | "declined" | null = null;

      if (trackingCookie) {
        cookieChoice = trackingCookie === "declined" ? "declined" : "accepted";
      }

      const trackingId = cookieChoice === "accepted"
        ? trackingCookie
        : generateTrackingId();

      ctx.state.cookieChoice = cookieChoice;
      ctx.state.trackingId = trackingId;

      return await ctx.next();
    } catch (err) {
      span.recordException(err as Error);
      throw err;
    } finally {
      span.end();
    }
  })
);
