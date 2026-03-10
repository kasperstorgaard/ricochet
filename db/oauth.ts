import { kv } from "#/db/kv.ts";

type OAuthState = { code_verifier: string; returnTo: string };

// 10 minutes in milliseconds
const STATE_TTL_MS = 10 * 60 * 1000;

export async function setOAuthState(
  state: string,
  value: OAuthState,
): Promise<void> {
  await kv.set(["oauth_state", state], value, { expireIn: STATE_TTL_MS });
}

/** Reads and immediately deletes the state — one-time use. */
export async function consumeOAuthState(
  state: string,
): Promise<OAuthState | null> {
  const entry = await kv.get<OAuthState>(["oauth_state", state]);
  await kv.delete(["oauth_state", state]);
  return entry.value ?? null;
}
