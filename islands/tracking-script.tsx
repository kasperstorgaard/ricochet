import { posthog } from "posthog-js";
import { useEffect } from "preact/hooks";

type TrackingProps = {
  // PostHog API key from environment.
  apiKey: string;
  // Whether user has consented to tracking.
  cookieChoice: "accepted" | "declined" | null;
  // User's tracking ID (UUID), or null if not allowed.
  trackingId: string;
};

/**
 * Initializes client-side PostHog analytics when tracking is allowed.
 * Uses /ph proxy to avoid direct connections to PostHog servers.
 * Pageviews are captured server-side, so capture_pageview is disabled.
 */
export function TrackingScript(
  { apiKey, cookieChoice, trackingId }: TrackingProps,
) {
  useEffect(() => {
    if (!apiKey) return;

    if (!posthog.__loaded) {
      posthog.init(apiKey, {
        api_host: "/ph",
        ui_host: "https://eu.posthog.com",
        defaults: "2025-11-30",
        cookieless_mode: "on_reject",
      });
    }

    if (cookieChoice === "accepted") {
      posthog.identify(trackingId);
      posthog.opt_in_capturing();
    } else if (cookieChoice === "declined") {
      posthog.opt_out_capturing();
    }
  }, [apiKey, cookieChoice, trackingId]);

  return null;
}
