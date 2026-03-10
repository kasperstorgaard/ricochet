# Auth0 login — opt-in passwordless OTP

## What was built

Opt-in login via Auth0 passwordless email OTP. Users who want cross-device
persistence can log in; all existing anonymous data is preserved under the same
userId.

## Auth design

The flow is standard OIDC Authorization Code + PKCE. Auth0 is used purely as an
identity verification step — we use the ID token once at callback time to
extract `sub` + `email`, then discard all Auth0 tokens. We manage our own KV
session with no TTL (cleared only on explicit logout).

This means:
- No refresh token handling needed — we hold no access token to refresh
- No token revocation handling — if an Auth0 account is suspended, the user
  keeps their existing app session until they explicitly log out
- The session is our own UUID in KV, not an Auth0 concept

## Auth0 config required

- Application type: Regular Web Application
- Authentication Profile: **Identifier First** (required for passwordless with
  New Universal Login)
- Connections: Email (passwordless) enabled, Username-Password disabled
- Allowed callback URLs: `http://localhost:5173/auth/callback, https://<prod>/auth/callback`
- Allowed logout URLs: `http://localhost:5173, https://<prod>`

## Identity & cross-device merge

Anonymous users have a `user_id` cookie (UUID). On first login the Auth0 `sub`
is linked to that UUID, preserving all existing history. On subsequent logins
(including from a new device), the existing userId follows the `sub` — the new
device's anonymous UUID is abandoned in favour of the authenticated account.

The `auth` middleware overrides `ctx.state.userId` with the session's userId so
all downstream KV lookups use the authenticated identity on every request.

## New KV keys

| Key | Value | Notes |
|-----|-------|-------|
| `["oauth_state", state]` | `{ code_verifier, returnTo }` | 10-min TTL, deleted on use |
| `["auth_session", sessionId]` | `{ sub, userId }` | No TTL, cleared on logout |
| `["auth", sub, "userId"]` | userId string | Links Auth0 sub → userId |
| `["user", userId, "email"]` | email string | For display |

## New env vars

```
AUTH0_DOMAIN
AUTH0_CLIENT_ID
AUTH0_CLIENT_SECRET
```

## Profile page

`/profile` is the single place for identity + settings:
- Anonymous: prominent "Sync your progress" login CTA
- Authenticated: email + logout link, no login CTA
- Theme switcher inline (replaces the old header dialog)
- Linked from all page headers via `ph-user-circle` icon

## What remains (UI/UX pass)

- Profile page visual polish
