import { PostHog } from "posthog-node";

const apiKey = Deno.env.get("POSTHOG_API_KEY");

/**
 * PostHog server-side client for capturing analytics events.
 * Note: disbled if no API key, like local development.
 */
export const posthog = apiKey
  ? new PostHog(
    apiKey,
    { host: "https://eu.i.posthog.com" },
  )
  : null;
