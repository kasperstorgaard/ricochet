# Completed puzzles UI revamp

## What was built

Replaced the old `getUserCompleted` (optimal-only slug list) with per-user solution indexes to show richer progress on puzzle cards across the archive and home page.

---

## Changes

### `components/puzzle-card.tsx`
- Replaced `completed?: boolean` with `bestMoves?: number`
- Three card states:
  - **Unsolved**: no badge; `:visited` dims SVG via `visited:svg-dim` and fades border via `group-visited:link-border-dim`
  - **Solved** (`bestMoves > minMoves`): `ph-check` pill badge in `text-brand`; `:visited` still fades border
  - **Optimal** (`bestMoves === minMoves`): `ph-trophy` pill badge in `text-ui-2` + `border-ui-2` accent border; no visited dim
- Pill: `bg-surface-1` + `border-current/60`, move count shown next to icon

### `routes/puzzles/index.tsx`
- Replaced `getUserCompleted` with `listUserSolutions(userId, { limit: 500 })`
- Computes `bestMoves: Record<string, number>` in memory (lowest move count per slug)
- Passes `bestMoves={bestMoves[puzzle.slug]}` to each `<PuzzleCard />`

### `routes/index.tsx`
- Same `listUserSolutions` pattern, fetched in parallel with puzzle lookups
- Both the daily puzzle card and the random/warm-up card receive `bestMoves`

### `db/user.ts`
- Removed `getUserCompleted` and `setUserCompleted` (no longer needed)

### `routes/puzzles/[slug]/index.tsx`
- Removed `setUserCompleted` call from POST handler (optimal tracking now derived from solution index)

### `styles.css`
- Added `@utility link-border-dim`: opaque approximation of `border-link/60` for use in `:visited` context — mixes with `--color-surface-1` instead of transparent (browsers block semi-transparent values in `:visited`)

### `routes/api/migrate-user-solutions.ts` (new, delete after use)
- `GET /api/migrate-user-solutions?secret=<MIGRATE_SECRET>`
- Scans all `["user", *, "completed"]` KV entries
- For each (userId, slug) with no existing `solutions_by_user_puzzle` entry: writes the optimal canonical group's `firstSolution` into the user's indexes
- Uses the user's own name from an existing solution if available, falls back to `"anon"`
- Streams progress as plain text

---

## CSS `:visited` note

Browsers block semi-transparent color values in `:visited` rules (privacy restriction). Opacity modifiers like `border-link/60` silently do nothing. The `link-border-dim` utility works around this by producing a fully opaque color via `color-mix(..., var(--color-surface-1))`. See: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:visited#privacy_restrictions
