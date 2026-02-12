import { define } from "#/core.ts";
import { generateTrackingId, getTrackingCookie } from "#/util/cookies.ts";

/**
 * Middleware that evaluates tracking consent and captures pageviews.
 *
 * Sets ctx.state.cookieChoice and trackingId
 * based on the tracking_id cookie value.
 */
export const tracking = define.middleware(async (ctx) => {
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
  ctx.state.featureFlags = ctx.state.featureFlags || {};

  return await ctx.next();
});
