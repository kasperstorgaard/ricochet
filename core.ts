import { createDefine } from "fresh";

/**
 * Shared state passed through ctx.state in middlewares, layouts, and routes.
 * Set by the tracking middleware in middleware/tracking.ts.
 */
export type State = {
  // The users current cookie choice;
  cookieChoice: "accepted" | "declined" | null;
  // The user's tracking ID (UUID), either temporary or stored in cookie
  trackingId: string;

  featureFlags: {
    // show minimum moves
    minMoves?: boolean | null;
  };
};

export const define = createDefine<State>();
