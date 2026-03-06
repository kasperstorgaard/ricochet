# Fix: Recursive 500 on invalid puzzle slugs

## Problem

Requests like `/puzzles/toby.md` (from crawlers guessing file paths) caused infinite recursion and a 500 error.

The chain:
1. `staticFiles()` finds no file at `/puzzles/toby.md`, calls `next()`
2. `[slug]` route matches with `slug = "toby.md"`
3. `getPuzzle` fetches `/puzzles/toby.md.md`
4. That request also gets no static file, falls through to `[slug]` with `slug = "toby.md.md"`
5. Repeats until stack overflow → 500

PostHog showed the error as `Failed to load puzzle: toby.md.md.md.md.md (500)`, which made the recursion visible.

## Changes

### `routes/puzzles/[slug]/index.tsx`
Added a slug format guard at the top of the GET handler. Slugs must match `/^[a-z]+$/` — letters only, no dots, dashes, or uppercase. Anything else gets a 404 immediately, before any fetch occurs.

### `game/loader.ts`
`getPuzzle` now returns `Puzzle | null` on 404 instead of throwing. This separates "puzzle not found" (expected, user-facing) from real errors like network failures or parse errors (unexpected, should still throw).

### Route callsites
- `routes/puzzles/[slug]/clone.tsx` — was missing a null check, added one
- All other callers already had null checks
- Internal manifest-based callers in `loader.ts` keep a cast to `Puzzle[]` — the manifest should not lie
