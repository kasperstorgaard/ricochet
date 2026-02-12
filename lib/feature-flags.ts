import { State } from "#/core.ts";
import { posthog } from "#/lib/posthog.ts";

/**
 * Check if the difficulty badge feature flag is enabled for the current user.
 * Defaults to false if tracking is not allowed.
 */
export async function getDifficultyBadgeFlag(state: State) {
  const { cookieChoice, trackingId } = state;

  if (!posthog || cookieChoice !== "accepted") return null;

  const flag = await posthog.getFeatureFlag("difficulty-badge", trackingId);

  return flag === "test";
}
