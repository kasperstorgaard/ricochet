import { getCookies } from "@std/http/cookie";

import { define } from "#/core.ts";
import { getAuthSession, getUserEmail } from "#/db/user.ts";

const AUTH_SESSION_KEY = "auth_session";

/**
 * Middleware that reads the auth_session cookie and, if valid, promotes the
 * request to an authenticated identity.
 *
 * When a session is found we override ctx.state.userId with the session's
 * userId. This is intentional: the anonymous user_id cookie is irrelevant once
 * the user is authenticated — all data (solutions, theme, onboarding) should
 * follow the authenticated identity, including on new devices where the
 * anonymous UUID would otherwise be different.
 *
 * Non-blocking: missing or invalid sessions silently fall back to anonymous.
 */
export const auth = define.middleware(async (ctx) => {
  const cookies = getCookies(ctx.req.headers);
  const sessionId = cookies[AUTH_SESSION_KEY];

  if (sessionId) {
    const session = await getAuthSession(sessionId);
    if (session) {
      // Override the anonymous userId so all downstream lookups use the
      // authenticated identity.
      ctx.state.userId = session.userId;
      const email = await getUserEmail(session.userId);
      if (email) {
        ctx.state.email = email;
      }
    }
  }

  return await ctx.next();
});
