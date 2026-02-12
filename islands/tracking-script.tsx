import { posthog } from "posthog-js";
import { useEffect } from "preact/hooks";

type TrackingProps = {
  // PostHog API key from environment.
  apiKey: string;
  // Whether user has consented to tracking.
  trackingAllowed: boolean;
  // User's tracking ID (UUID), or null if not allowed.
  trackingId: string | null;
};

/**
 * Initializes client-side PostHog analytics when tracking is allowed.
 * Uses /ph proxy to avoid direct connections to PostHog servers.
 * Pageviews are captured server-side, so capture_pageview is disabled.
 */
export function TrackingScript(
  { apiKey, trackingAllowed, trackingId }: TrackingProps,
) {
  useEffect(() => {
    if (apiKey && trackingAllowed && trackingId) {
      posthog.init(apiKey, {
        api_host: "/ph",
        ui_host: "https://eu.posthog.com",
        defaults: "2025-11-30",
        autocapture: true,
        cookieless_mode: "on_reject",
      });

      posthog.identify(trackingId);
    }

    return () => {
      if (!trackingAllowed) posthog.opt_out_capturing();
    };
  }, [apiKey, trackingAllowed, trackingId]);

  return null;
}
