import { createDefine } from "fresh";

/**
 * Shared state passed through ctx.state in middlewares, layouts, and routes.
 * Set by the tracking middleware in middleware/tracking.ts.
 */
export type State = {
  // True if user accepted tracking (has valid tracking ID).
  trackingAllowed: boolean;
  // True if user explicitly declined tracking.
  trackingDeclined: boolean;
  // The user's tracking ID (UUID), or null if not allowed.
  trackingId: string | null;

  featureFlags: {
    difficultyBadge?: boolean | null;
  };
};

export const define = createDefine<State>();
