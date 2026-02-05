import { posthog } from "posthog-js";
import { useEffect } from "preact/hooks";

type TrackingProps = {
  apiKey: string;
  trackingAllowed: boolean;
  trackingId: string | null;
};

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
        capture_pageview: false,
      });

      posthog.identify(trackingId);
    }

    return () => {
      if (!trackingAllowed) posthog.opt_out_capturing();
    };
  }, [apiKey, trackingAllowed, trackingId]);

  return null;
}
