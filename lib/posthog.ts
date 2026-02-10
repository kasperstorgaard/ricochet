import { PostHog } from "posthog-node";

/** PostHog server-side client for capturing analytics events. */
export const posthog = new PostHog(
  Deno.env.get("POSTHOG_API_KEY") as string,
  {
    host: "https://eu.i.posthog.com",
  },
);
