import { define } from "#/core.ts";
import { kv } from "#/db/kv.ts";

// 10 minutes in milliseconds
const STATE_TTL_MS = 10 * 60 * 1000;

function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

async function pkce(): Promise<{ verifier: string; challenge: string }> {
  const verifierBytes = crypto.getRandomValues(new Uint8Array(32));
  const verifier = base64url(verifierBytes);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );
  const challenge = base64url(new Uint8Array(digest));
  return { verifier, challenge };
}

export const handler = define.handlers({
  async GET(ctx) {
    const domain = Deno.env.get("AUTH0_DOMAIN");
    const clientId = Deno.env.get("AUTH0_CLIENT_ID");

    if (!domain || !clientId) {
      return new Response("Auth not configured", { status: 503 });
    }

    const rawReturnTo = ctx.url.searchParams.get("returnTo") ?? "/";
    // Only allow same-origin return URLs
    const returnTo = rawReturnTo.startsWith("/") ? rawReturnTo : "/";

    const { verifier, challenge } = await pkce();
    const state = base64url(crypto.getRandomValues(new Uint8Array(16)));

    await kv.set(
      ["oauth_state", state],
      { code_verifier: verifier, returnTo },
      { expireIn: STATE_TTL_MS },
    );

    const authorizeUrl = new URL(`https://${domain}/authorize`);
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("client_id", clientId);
    authorizeUrl.searchParams.set(
      "redirect_uri",
      `${ctx.url.origin}/auth/callback`,
    );
    authorizeUrl.searchParams.set("scope", "openid email");
    authorizeUrl.searchParams.set("connection", "email");
    authorizeUrl.searchParams.set("state", state);
    authorizeUrl.searchParams.set("code_challenge", challenge);
    authorizeUrl.searchParams.set("code_challenge_method", "S256");

    return new Response(null, {
      status: 303,
      headers: { Location: authorizeUrl.href },
    });
  },
});
