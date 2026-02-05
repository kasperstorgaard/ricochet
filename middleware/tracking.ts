import { PostHog } from "posthog-node";

import { define } from "#/core.ts";
import { getTrackingCookie } from "#/util/cookies.ts";

const client = new PostHog(
  Deno.env.get("POSTHOG_API_KEY") as string,
  {
    host: "https://eu.i.posthog.com",
  },
);

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
  client.capture({
    distinctId: trackingId ?? undefined,
    event: "$pageview",
    properties: {
      $current_url: ctx.req.url,
      $process_person_profile: trackingAllowed,
    },
  });

  return await ctx.next();
});
