# User KV consolidation + middleware routing

## Problem

Three sequential KV reads in middleware add ~285ms to every request:
- `kv.getAuthSession` ~95ms
- `kv.getUserTheme` ~94ms
- `kv.getUserOnboarding` ~96ms

Plus middlewares run on all requests including static files and the PostHog proxy.

## Solution

### 1. Move middlewares to `routes/_middleware.ts`

`tracking`, `auth`, `theme`, `onboarding` move from `main.ts` `app.use()` calls
into `routes/_middleware.ts` so they only run on actual route requests.

`posthogProxy` and `telemetry` stay in `main.ts` as global middlewares — posthog
must intercept `/ph/*` before routing, and telemetry annotates all requests.

### 2. Collapse user KV into a single object

**Before**: three separate keys, three sequential reads:
```
["user", userId, "theme"]      → string
["user", userId, "onboarding"] → Onboarding
["user", userId, "email"]      → string
["user", userId, "name"]       → string
```

**After**: one key, one read:
```
["user", userId] → UserProfile
```

New type in `db/types.ts`:
```ts
type UserProfile = {
  theme?: string;
  onboarding?: Onboarding;
  email?: string;
  name?: string;
};
```

`db/user.ts` gets a `getUserProfile` / `setUserProfile` pair. Individual field
setters (`setUserTheme`, `setUserEmail` etc.) become read-modify-write on the
single key. The `theme` middleware does one `getUserProfile` call and sets both
`ctx.state.theme` and any other fields needed downstream — removing the need for
`onboarding` to make its own read.

### 3. Migration endpoint — `routes/api/migrate-user.ts`

`GET /api/migrate-user?secret=<MIGRATE_SECRET>` — streams a plain-text log as
it runs (same pattern as `migrate-user-solutions.ts`).

Scans all `["user", *, "theme" | "onboarding" | "email" | "name"]` keys, groups
by userId, writes a single `["user", userId]` object per user, then deletes the
old keys. Idempotent: skips users whose new key already exists.

DELETE the route after confirming migration output.

## Files changed

- `routes/_middleware.ts` — new file wiring tracking/auth/theme/onboarding
- `main.ts` — remove app.use() calls for moved middlewares
- `db/types.ts` — add `UserProfile` type
- `db/user.ts` — add `getUserProfile`/`setUserProfile`, update field setters
- `middleware/theme.ts` — use `getUserProfile`, set all profile fields on state
- `middleware/onboarding.ts` — read from state (set by theme middleware), no KV call
- `middleware/auth.ts` — read email from profile instead of separate KV call
- `core.ts` — remove separate `theme`/`email` state fields, consolidate if needed
- `routes/api/migrate-user.ts` — migration endpoint

## Out of scope

- Parallelising remaining KV calls (profile + auth session could run concurrently — next step)
- Bulk migration across all users
