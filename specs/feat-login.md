# Auth0 login — opt-in passwordless OTP

## What was built

Opt-in login via Auth0 passwordless email OTP. Users who want cross-device
persistence can log in; all existing anonymous data is preserved under the same
userId. A new `/profile` page replaces the header theme dialog and serves as the
single place for identity and settings.

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

## New env vars

```
AUTH0_DOMAIN
AUTH0_CLIENT_ID
AUTH0_CLIENT_SECRET
```

## New dependency

```
jose  (npm:jose@^5)
```

Used for JWKS-based ID token validation in `/auth/callback`.

## New files

| File | Purpose |
|------|---------|
| `middleware/auth.ts` | Unified identity middleware — two branches: authenticated session (override userId + set email) vs anonymous (read/create user_id cookie) |
| `routes/auth/login.ts` | Initiates PKCE flow, stores oauth state in KV, redirects to Auth0 |
| `routes/auth/callback.ts` | Exchanges code, validates ID token, cross-device merge, creates session |
| `routes/auth/logout.ts` | Deletes session from KV, clears cookie, redirects to `/profile` |
| `routes/profile.tsx` | Combined identity + theme settings page |
| `lib/auth-cookie.ts` | Cookie helpers for `auth_session` |
| `lib/user-cookie.ts` | Cookie helpers for `user_id` |
| `lib/pkce.ts` | PKCE verifier/challenge + state generation |
| `lib/themes.ts` | `THEMES` array and `Theme` type (extracted from deleted ThemePicker island) |
| `db/auth.ts` | KV ops for auth sessions, sub→userId mapping, and oauth state |

## Deleted files

- `middleware/user.ts` — absorbed into `middleware/auth.ts`
- `db/oauth.ts` — merged into `db/auth.ts`
- `routes/api/theme.ts` — merged into `routes/profile.tsx`
- `routes/api/username.ts` — merged into `routes/profile.tsx`
- `islands/theme-picker.tsx` — replaced by server-rendered form on profile page

## New KV keys

| Key | Value | Notes |
|-----|-------|-------|
| `["oauth_state", state]` | `{ code_verifier, returnTo }` | 10-min TTL, deleted on use |
| `["auth_session", sessionId]` | `{ sub, userId }` | No TTL, cleared on logout |
| `["auth", sub, "userId"]` | userId string | Links Auth0 sub → userId |
| `["user", userId, "email"]` | email string | For display on profile |
| `["user", userId, "name"]` | name string | Username, prefills solution dialog |

## Profile page

`/profile` is the single place for identity + settings:
- Anonymous: "Sync your progress" login CTA
- Authenticated: email + logout link
- Username form (prefills solution dialog on puzzle submit)
- Theme switcher inline (replaces the old header dialog)
- Linked from all page headers via `ph-user-circle` icon

## What remains (UI/UX pass)

- Profile page visual polish
- Stats section: solved count, day streak, solved puzzles list (TODO placeholder in code)
