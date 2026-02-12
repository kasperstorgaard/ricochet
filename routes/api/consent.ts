import { define } from "#/core.ts";
import { generateTrackingId, setTrackingCookie } from "#/util/cookies.ts";
import { posthog } from "../../lib/posthog.ts";

/**
 * Handles cookie consent form submissions from the CookieBanner.
 *
 * POST /api/consent
 * - action=accept: Generates new tracking ID and sets cookie
 * - action=decline: Sets cookie to "declined"
 *
 * Redirects back to the referring page after setting the cookie.
 */
export const handler = define.handlers({
  async POST(ctx) {
    const formData = await ctx.req.formData();
    const action = formData.get("action");
    const referer = ctx.req.headers.get("referer") || "/";

    const headers = new Headers();
    headers.set("Location", referer);

    // If users accepts cookies, generate a new tracking id.
    // If not, set cookie to "declined" to avoid asking again.
    const isAllowed = action === "accept";
    const trackingId = isAllowed ? generateTrackingId() : null;

    ctx.state.trackingId = trackingId;
    setTrackingCookie(headers, trackingId ?? "declined");

    posthog?.capture({
      event: "cookie_consent",
      distinctId: trackingId ?? undefined,
      properties: {
        decision: isAllowed ? "accepted" : "declined",
        $current_url: referer,
        $process_person_profile: isAllowed,
      },
    });

    return new Response("", {
      status: 302,
      headers,
    });
  },
});
