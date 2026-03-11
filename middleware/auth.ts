import { trace } from "@opentelemetry/api";

import { define } from "#/core.ts";
import { getAuthSession } from "#/db/auth.ts";
import { getAuthSessionId } from "#/lib/auth-cookie.ts";
import { getUserIdCookie, setUserIdCookie } from "#/lib/user-cookie.ts";

/**
 * Establishes user identity for every request.
 * Priority: authenticated session > existing anonymous cookie > new visitor.
 */
export const auth = define.middleware(async (ctx) => {
  const sessionId = getAuthSessionId(ctx.req.headers);
  const session = sessionId ? await getAuthSession(sessionId) : null;

  let userId = session?.userId ?? getUserIdCookie(ctx.req.headers);
  const isNew = !userId;
  if (!userId) userId = crypto.randomUUID();

  ctx.state.userId = userId;
  trace.getActiveSpan()?.setAttribute("user.id", userId);

  const response = await ctx.next();

  if (isNew) {
    const headers = new Headers(response.headers);
    setUserIdCookie(headers, userId);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  return response;
});
