import { setCookie } from "@std/http/cookie";
import { createRemoteJWKSet, jwtVerify } from "jose";

import { define } from "#/core.ts";
import { kv } from "#/db/kv.ts";
import {
  getSubUserId,
  setAuthSession,
  setSubUserId,
  setUserEmail,
} from "#/db/user.ts";
import { isDev } from "#/lib/env.ts";

// 1 year in seconds
const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const AUTH_SESSION_KEY = "auth_session";

type OAuthState = { code_verifier: string; returnTo: string };

export const handler = define.handlers({
  async GET(ctx) {
    const domain = Deno.env.get("AUTH0_DOMAIN");
    const clientId = Deno.env.get("AUTH0_CLIENT_ID");
    const clientSecret = Deno.env.get("AUTH0_CLIENT_SECRET");

    if (!domain || !clientId || !clientSecret) {
      return new Response("Auth not configured", { status: 503 });
    }

    const code = ctx.url.searchParams.get("code");
    const state = ctx.url.searchParams.get("state");

    if (!code || !state) {
      return new Response("Missing code or state", { status: 400 });
    }

    // Look up and immediately delete the state (one-time use)
    const stateEntry = await kv.get<OAuthState>(["oauth_state", state]);
    await kv.delete(["oauth_state", state]);

    if (!stateEntry.value) {
      return new Response("Invalid or expired state", { status: 401 });
    }

    const { code_verifier, returnTo } = stateEntry.value;

    // Exchange code for tokens
    const tokenRes = await fetch(`https://${domain}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: `${ctx.url.origin}/auth/callback`,
        code_verifier,
      }),
    });

    if (!tokenRes.ok) {
      return new Response("Token exchange failed", { status: 502 });
    }

    const tokens = await tokenRes.json();
    const idToken: string = tokens.id_token;

    // We only use the ID token — to extract sub + email and verify the user's
    // identity via JWKS. The access token and refresh token are intentionally
    // discarded: we don't call any Auth0 APIs after login, so there is nothing
    // to keep authorised or to refresh. Our own KV session (no TTL, cleared on
    // explicit logout) is the only ongoing credential. This is valid OIDC usage
    // — we just treat the handshake as a one-time identity check rather than
    // ongoing delegated access.
    const JWKS = createRemoteJWKSet(
      new URL(`https://${domain}/.well-known/jwks.json`),
    );

    let sub: string;
    let email: string;

    try {
      const { payload } = await jwtVerify(idToken, JWKS, {
        issuer: `https://${domain}/`,
        audience: clientId,
      });
      sub = payload.sub as string;
      email = payload.email as string;
    } catch {
      return new Response("ID token validation failed", { status: 401 });
    }

    // Cross-device merge: if this Auth0 sub has logged in before, use that
    // existing userId (so the user's history follows them). If this is the
    // first login, adopt the current anonymous userId from the user_id cookie —
    // the user's existing anonymous progress is preserved rather than lost.
    const existingUserId = await getSubUserId(sub);
    const userId = existingUserId ?? ctx.state.userId;

    await Promise.all([
      setSubUserId(sub, userId),
      setUserEmail(userId, email),
    ]);

    const sessionId = crypto.randomUUID();
    await setAuthSession(sessionId, { sub, userId });

    const headers = new Headers({ Location: returnTo });
    setCookie(headers, {
      name: AUTH_SESSION_KEY,
      value: sessionId,
      httpOnly: true,
      path: "/",
      secure: !isDev,
      maxAge: SESSION_COOKIE_MAX_AGE,
      sameSite: "Lax",
    });

    return new Response(null, { status: 303, headers });
  },
});
