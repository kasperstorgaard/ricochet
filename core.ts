import { createDefine } from "fresh";

import type { Onboarding } from "#/game/types.ts";

/**
 * Shared state passed through ctx.state in middlewares, layouts, and routes.
 * Set by the tracking middleware in middleware/tracking.ts.
 */
export type State = {
  // Stable anonymous user identity (UUID, httpOnly cookie)
  userId: string;

  // The users current cookie choice;
  cookieChoice: "accepted" | "declined" | null;
  // The user's tracking ID (UUID), either temporary or stored in cookie
  trackingId: string;

  // Explicit theme override (null = follow OS preference)
  theme?: string | null;

  // Player onboarding progression
  onboarding: Onboarding;
};

export const define = createDefine<State>();
