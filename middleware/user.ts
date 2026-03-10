import { getCookies, setCookie } from "@std/http/cookie";

import { define } from "#/core.ts";
import { isDev } from "#/lib/env.ts";

const USER_ID_KEY = "user_id";
// 5 years in seconds
const USER_ID_DURATION = 60 * 60 * 24 * 365 * 5;

/**
 * Middleware that reads or creates the user_id cookie.
 * Sets ctx.state.userId.
 */
export const user = define.middleware(async (ctx) => {
  const cookies = getCookies(ctx.req.headers);

  let userId = cookies[USER_ID_KEY];
  const isNew = !userId;

  if (!userId) {
    userId = crypto.randomUUID();
  }

  console.log("uid:", userId);
  ctx.state.userId = userId;

  const response = await ctx.next();

  if (isNew) {
    // Response.redirect() and some Fresh responses use immutable headers,
    // so copy into a new mutable Headers before setting the cookie.
    const headers = new Headers(response.headers);
    setCookie(headers, {
      name: USER_ID_KEY,
      value: userId,
      httpOnly: true,
      path: "/",
      secure: !isDev,
      maxAge: USER_ID_DURATION,
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  return response;
});
