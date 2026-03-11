# User KV consolidation + middleware routing

## Problem

Three sequential KV reads in middleware add ~285ms to every request:
- `kv.getAuthSession` ~95ms
- `kv.getUserTheme` ~94ms
- `kv.getUserOnboarding` ~96ms

Plus middlewares run on all requests including static files and the PostHog proxy.

## Solution

### 1. Move middlewares to `routes/_middleware.ts`

`tracking`, `auth`, `user` run from `routes/_middleware.ts` so they only apply
to route requests. `posthogProxy` and `telemetry` stay in `main.ts` — posthog
must intercept `/ph/*` before routing, telemetry annotates all requests.

### 2. Collapse user KV into a single object

**Before**: four separate keys, multiple sequential reads:
```
["user", userId, "theme"]      → string
["user", userId, "onboarding"] → Onboarding
["user", userId, "email"]      → string
["user", userId, "name"]       → string
```

**After**: one key, one read:
```
["user", userId] → User
```

New type in `db/types.ts`:
```ts
type User = {
  id: string;
  onboarding: Onboarding;
  theme?: string;
  email?: string;
  name?: string;
};
```

`db/user.ts` exposes `getUser` / `setUser(userId, Partial<Omit<User, "id">>)`.
`setUser` does read-modify-write so callers only patch the fields they care about.

`middleware/theme.ts` and `middleware/onboarding.ts` are deleted. A single
`middleware/user.ts` does one `getUser` call and sets `ctx.state.user`. On first
hit (no KV record), it writes a default record so all subsequent reads are real.
Skips `/api/migrate*` to avoid a catch-22 during migration.

`ctx.state.user` is always a full `User` object. Login status: `!!user.email`.

### 3. Migration endpoint — `routes/api/migrate-user.ts`

`GET /api/migrate-user?secret=<MIGRATE_SECRET>` — streams a plain-text log.

Per user: reads each old field key directly, writes a single `["user", userId]`
object, deletes old keys atomically. Idempotent: skips users whose new key
already exists. Run immediately after deploy.

DELETE the route after confirming migration output.

## Files changed

- `routes/_middleware.ts` — wires tracking/auth/user
- `main.ts` — only global middlewares remain (telemetry, posthogProxy)
- `core.ts` — `State` now has `user: User`; removed `theme`, `email`, `onboarding` top-level fields
- `db/types.ts` — `User` type (replaces `UserProfile`)
- `db/user.ts` — `getUser`/`setUser`; individual field getters/setters removed
- `middleware/user.ts` — replaces theme + onboarding middlewares; creates user on first hit
- `middleware/theme.ts` — deleted (stub comment remains)
- `middleware/onboarding.ts` — deleted (stub comment remains)
- `routes/api/migrate-user.ts` — migration endpoint
- `routes/auth/callback.ts` — `setUser(userId, { email })`
- `routes/puzzles/[slug]/index.tsx` — `setUser` for name/onboarding; `savedName` from `ctx.state.user.name`
- `routes/puzzles/tutorial.tsx` — `setUser` for onboarding
- `routes/profile.tsx` — `setUser` for name/theme; reads from `ctx.state.user`
