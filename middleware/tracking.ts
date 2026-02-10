import { define } from "#/core.ts";
import { posthog } from "#/lib/posthog.ts";
import { getTrackingCookie } from "#/util/cookies.ts";

/**
 * Middleware that evaluates tracking consent and captures pageviews.
 *
 * Sets ctx.state.trackingAllowed, trackingDeclined, and trackingId
 * based on the tracking_id cookie value.
 *
 * Captures $pageview events server-side. Anonymous users (no consent yet
 * or declined) are tracked without person profiles.
 */
export const tracking = define.middleware(async (ctx) => {
  const trackingCookie = getTrackingCookie(ctx.req.headers);

  const trackingDeclined = trackingCookie === "declined";
  const trackingAllowed = !trackingDeclined && Boolean(trackingCookie);

  const trackingId = trackingAllowed ? trackingCookie : null;

  ctx.state.trackingDeclined = trackingDeclined;
  ctx.state.trackingAllowed = trackingAllowed;
  ctx.state.trackingId = trackingId;

  // Capture page views on server
  // if not allowed, will show up as anonymous user
  posthog?.capture({
    distinctId: trackingId ?? undefined,
    event: "$pageview",
    properties: {
      $current_url: ctx.req.url,
      $process_person_profile: trackingAllowed,
    },
  });

  return await ctx.next();
});
