# Anonymous userId + KV-backed user data

## Context

All per-user state currently lives in individual cookies (completed puzzles, theme,
onboarding, hint counts, stored puzzle). This has two problems:

1. **Scalability ceiling** — cookies have a 4 KB limit; completed puzzles alone will
   eventually hit it as the puzzle library grows.
2. **Login wall** — to ever support a real account system, you need a stable user
   identity. Without it, migrating cookie data to a real account is nearly impossible.

The fix: introduce a persistent anonymous `user_id` UUID cookie (httpOnly, no consent
required). All per-user data moves to KV keyed by this UUID, leaving only `tracking_id`
as a cookie (analytics — unchanged). Solutions already in KV get a `userId` field added.

This doesn't add login — it just makes login possible later.

---

## What changes

### Cookies after this change

| Cookie | Status | Notes |
|--------|--------|-------|
| `user_id` | **New** | UUID anchor, httpOnly, 5yr, always set |
| `tracking_id` | Unchanged | Analytics consent |
| `completed_puzzles` | **Removed** → KV | Migrated on first request |
| `theme` | **Removed** → KV | Migrated on first request |
| `onboarding` | **Removed** → KV | Migrated on first request |
| `stored_puzzle` | **Removed** → KV | Migrated on first request |
| `hint_count` | Unchanged | Path-scoped per puzzle, 24h TTL — stays as cookie |

### KV key structure (new)

```
["user", userId, "completed"]                    → string[]   (optimal puzzle slugs)
["user", userId, "theme"]                        → string | null
["user", userId, "onboarding"]                   → Onboarding
["user", userId, "stored_puzzle"]                → Puzzle | null
["solutions_by_user", userId, id]                → Solution   (user history)
["solutions_by_user_puzzle", userId, slug, id]   → Solution   (user's attempts per puzzle)
```

Solutions get a new optional field: `userId?: string` (backwards-compatible — existing
solutions without it are unaffected).

---

## Files to create

### `middleware/user.ts`
Reads or creates the `user_id` cookie. Runs before onboarding/theme middleware.
Sets `ctx.state.userId`.

On **first visit** (no `user_id` cookie):
1. Generate UUID
2. Read any existing legacy cookies (`completed_puzzles`, `theme`, `onboarding`,
   `stored_puzzle`)
3. Write them to KV under the new userId (one-time migration)
4. Set `user_id` cookie in response; legacy cookies will naturally expire

### `db/user.ts`
All KV operations for user data. Functions:

```ts
getUserCompleted(userId: string): Promise<string[]>
setUserCompleted(userId: string, slugs: string[]): Promise<void>
getUserTheme(userId: string): Promise<string | null>
setUserTheme(userId: string, theme: string | null): Promise<void>
getUserOnboarding(userId: string): Promise<Onboarding>
setUserOnboarding(userId: string, value: Onboarding): Promise<void>
getUserStoredPuzzle(userId: string): Promise<Puzzle | null>
setUserStoredPuzzle(userId: string, puzzle: Puzzle): Promise<void>
```

---

## Files to modify

### `db/types.ts`
Add `userId?: string` to `Solution` (optional for backwards compat).

### `db/kv.ts`
Reduced to a single line — just exports the `Deno.openKv()` instance.

### `db/solutions.ts` (new, replaces the functions previously in `db/kv.ts`)
- `addSolution`: accept `userId?` in payload; add atomic writes for
  `["solutions_by_user", userId, id]` and `["solutions_by_user_puzzle", userId, slug, id]`
  when userId is present.
- `listUserSolutions(userId, options)` — user history across all puzzles.
- `listUserPuzzleSolutions(userId, puzzleSlug, options)` — user's attempts at a specific puzzle.
- All existing solution/solve functions unchanged, just moved here.

### `core.ts`
Add `userId: string` to `State`.

### `game/cookies.ts`
Keep `tracking_id` functions unchanged. Remove the functions moving to KV:
`getCompletedSlugs`, `setCompletedSlugs`, `getThemeCookie`, `setThemeCookie`,
`getOnboardingCookie`, `setOnboardingCookie`, `getStoredPuzzle`, `setStoredPuzzleCookie`.
`getHintCount` / `setHintCount` stay (path-scoped cookie, unchanged).

### `middleware/onboarding.ts`
Switch to `getUserOnboarding(ctx.state.userId)`.

### `middleware/theme.ts`
Switch to `getUserTheme(ctx.state.userId)`.

### `main.ts`
Add user middleware between tracking and theme/onboarding.

### `routes/puzzles/[slug]/index.tsx` (POST handler)
- Pass `userId` to `addSolution()`
- Replace completed/onboarding cookie calls with KV equivalents

### `routes/puzzles/index.tsx`
Replace `getCompletedSlugs` with `getUserCompleted(ctx.state.userId)`.

### `routes/api/theme.ts`
Replace `setThemeCookie` with `setUserTheme(ctx.state.userId, theme)`.

### `routes/api/store.ts`
Replace `setStoredPuzzleCookie` with `setUserStoredPuzzle(ctx.state.userId, puzzle)`.

### `routes/api/import.ts`
Same as store.ts.

### `routes/api/export.ts`
Replace `getStoredPuzzle` with `getUserStoredPuzzle(ctx.state.userId)`.

### `routes/puzzles/new.tsx`
Replace `getStoredPuzzle` with `getUserStoredPuzzle(ctx.state.userId)`.

---

## Migration strategy

One-time, transparent, on first request after deploy:

1. User has no `user_id` cookie → generate UUID
2. Read legacy cookies from request
3. Write non-null values to KV
4. Set `user_id` cookie; old cookies expire naturally

---

## Hints during onboarding

Hint limits are lifted until onboarding is `"done"`. New players can use as many hints
as needed to learn the game — and completing a puzzle via hints still triggers onboarding
completion, so the limit kicks in naturally after that.

## Verification

1. New visitor: no `user_id` → one gets set in response; subsequent requests use it
2. Returning visitor with old cookies: data migrated to KV on first request
3. Solve a puzzle: solution stored with `userId`; `completed` KV entry updated
4. Hint flow: hint count still increments via path-scoped cookie (unchanged)
5. Theme change: persists across sessions via KV
6. `tracking_id` cookie behaviour unchanged
7. `deno test -A` passes
