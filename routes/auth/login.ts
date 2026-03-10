import { define } from "#/core.ts";
import { setOAuthState } from "#/db/auth.ts";
import { pkce } from "#/lib/pkce.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const domain = Deno.env.get("AUTH0_DOMAIN");
    const clientId = Deno.env.get("AUTH0_CLIENT_ID");

    if (!domain || !clientId) {
      return new Response("Auth not configured", { status: 503 });
    }

    // Only allow same-origin paths to prevent open redirect.
    const returnTo = ctx.url.searchParams.get("return_to") ?? "/";
    if (!returnTo.startsWith("/")) {
      return new Response("Invalid return_to", { status: 400 });
    }

    // PKCE verifier/challenge + one-time state, verified in /auth/callback.
    const { verifier, challenge, state } = await pkce();
    await setOAuthState(state, { code_verifier: verifier, returnTo });

    const authorizeUrl = new URL("/authorize", `https://${domain}`);
    const redirectUrl = new URL("/auth/callback", ctx.url.origin);

    authorizeUrl.search = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUrl.href,
      scope: "openid email",
      connection: "email", // configured as passwordless in auth0
      state,
      code_challenge: challenge,
      code_challenge_method: "S256",
    }).toString();

    return new Response(null, {
      status: 303,
      headers: { Location: authorizeUrl.href },
    });
  },
});
