import { define } from "#/core.ts";
import { getAuthSession } from "#/db/auth.ts";
import { getUserEmail } from "#/db/user.ts";
import { getAuthSessionId } from "#/lib/auth-cookie.ts";
import { tracer } from "#/lib/telemetry.ts";
import { getUserIdCookie, setUserIdCookie } from "#/lib/user-cookie.ts";

/**
 * Establishes user identity for every request.
 * Priority: authenticated session > existing anonymous cookie > new visitor.
 */
export const auth = define.middleware((ctx) =>
  tracer.startActiveSpan("middleware.auth", async (span) => {
    try {
      const sessionId = getAuthSessionId(ctx.req.headers);
      const session = sessionId
        ? await tracer.startActiveSpan("kv.getAuthSession", async (s) => {
          try {
            return await getAuthSession(sessionId);
          } finally {
            s.end();
          }
        })
        : null;

      let userId = session?.userId ?? getUserIdCookie(ctx.req.headers);
      const isNew = !userId;
      if (!userId) userId = crypto.randomUUID();

      ctx.state.userId = userId;
      span.setAttribute("user.id", userId);

      if (session) {
        ctx.state.email = await tracer.startActiveSpan(
          "kv.getUserEmail",
          async (span) => {
            try {
              return (await getUserEmail(userId)) ?? undefined;
            } finally {
              span.end();
            }
          },
        );
      }

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
    } catch (err) {
      span.recordException(err as Error);
      throw err;
    } finally {
      span.end();
    }
  })
);
