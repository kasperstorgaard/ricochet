import { define } from "#/core.ts";
import { deleteAuthSession } from "#/db/auth.ts";
import { clearAuthSessionCookie, getAuthSessionId } from "#/lib/auth-cookie.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const sessionId = getAuthSessionId(ctx.req.headers);
    if (sessionId) await deleteAuthSession(sessionId);

    const headers = new Headers({ Location: "/" });
    clearAuthSessionCookie(headers);

    return new Response(null, { status: 303, headers });
  },
});
