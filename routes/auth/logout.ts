import { getCookies, setCookie } from "@std/http/cookie";

import { define } from "#/core.ts";
import { deleteAuthSession } from "#/db/user.ts";
import { isDev } from "#/lib/env.ts";

const AUTH_SESSION_KEY = "auth_session";

export const handler = define.handlers({
  async GET(ctx) {
    const cookies = getCookies(ctx.req.headers);
    const sessionId = cookies[AUTH_SESSION_KEY];

    if (sessionId) {
      await deleteAuthSession(sessionId);
    }

    const headers = new Headers({ Location: "/" });
    // Clear the cookie by setting maxAge to 0
    setCookie(headers, {
      name: AUTH_SESSION_KEY,
      value: "",
      httpOnly: true,
      path: "/",
      secure: !isDev,
      maxAge: 0,
    });

    return new Response(null, { status: 303, headers });
  },
});
