import { kv } from "#/db/kv.ts";

// ── Session ──────────────────────────────────────────────────────────────────

type AuthSession = { sub: string; userId: string };

export async function getAuthSession(
  sessionId: string,
): Promise<AuthSession | null> {
  const res = await kv.get<AuthSession>(["auth_session", sessionId]);
  return res.value ?? null;
}

export async function setAuthSession(
  sessionId: string,
  session: AuthSession,
): Promise<void> {
  await kv.set(["auth_session", sessionId], session);
}

export async function deleteAuthSession(sessionId: string): Promise<void> {
  await kv.delete(["auth_session", sessionId]);
}

// ── Sub → userId mapping ──────────────────────────────────────────────────────

export async function getSubUserId(sub: string): Promise<string | null> {
  const res = await kv.get<string>(["auth", sub, "userId"]);
  return res.value ?? null;
}

export async function setSubUserId(
  sub: string,
  userId: string,
): Promise<void> {
  await kv.set(["auth", sub, "userId"], userId);
}

// ── OAuth state (PKCE handshake, one-time use) ────────────────────────────────

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
