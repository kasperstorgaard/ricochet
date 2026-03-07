# Solution stats in dialog

## Context

The solution dialog shows meaningful stats based on other players' solutions —
making the solve moment feel more rewarding and social without requiring a
leaderboard page.

## Stats (priority order)

1. **First optimal** — "You found the first perfect solution, well done!"
   - Shown if `moves.length === puzzle.minMoves` AND `solutionsHistogram[moves.length]` is absent
   - Uses the histogram bucket as a proxy: if no one has solved in this move count, this is the first optimal

2. **Top 40% by move count** — "Sharp! You used fewer moves than {X}% of players."
   - Shown if `getSolutionPercentile(stats, moves.length) >= 60`
   - Percentile rounded to nearest 5% for display
   - Only shown when `totalSolutions >= 10` — below that the sample is too small to be meaningful

3. **Neutral fallback** — "Good solve — {N} others have solved this, post yours."
   - Shown when stats 1 and 2 don't apply and `totalSolutions > 0`
   - Singular handled: "1 other has…"

4. **No solutions yet** — "Be the first to post a solution."

## Data

Stats come from `["puzzle_stats", slug]` KV key, fetched in the GET handler in
parallel with the puzzle load. Coalesced to `defaultPuzzleStats` (all zeros) if
null, so the island always receives a non-null `PuzzleStats`.

Stats are fetched at page load — a user who takes a long time to solve will see
slightly stale numbers. Acceptable; this is cosmetic.

### KV key: `["puzzle_stats", slug]`

```ts
// game/types.ts
type PuzzleStats = {
  totalSolutions: number;
  solutionsHistogram: Record<number, number>; // moveCount → frequency
  firstSolvedAt?: string;  // ISO date, set on first solve
  uniqueSolvers: number;   // deduplicated via presence key when userId present
  hintUsageCount: number;
};
```

### KV key: `["puzzle_solvers", slug, userId]`

Presence key (`true`) for deduplicating `uniqueSolvers`. Checked atomically in
`updatePuzzleStats` — if absent, increment `uniqueSolvers` and set key in the
same commit. Anonymous sessions (no `userId`) always increment.

Updated best-effort fire-and-forget after `addSolution`. May drift slightly;
acceptable — a lost solution is serious, a stale histogram is not.

`hintUsageCount` incremented separately from the hint route
(`incrementHintUsageCount`). Skipped if no stats entry exists yet.

### Known limitations

- `totalSolutions` and `solutionsHistogram` count repeat solvers — both the
  displayed count and percentiles can be skewed at scale. Switch to
  `uniqueSolvers` for the count; consider capping histogram contributions per
  user.

## Files changed

### `game/types.ts`
`PuzzleStats` type (moved here from `db/types.ts`; re-exported from `db/types.ts`).

### `game/stats.ts`
- `defaultPuzzleStats` — zero-value constant used for coalescing null stats.
- `getSolutionPercentile(stats, moveCount)` — percentile rank (0–100); % of solutions with more moves.

### `game/stats_test.ts`
Unit tests for `getSolutionPercentile`.

### `db/types.ts`
Re-exports `PuzzleStats` from `game/types.ts`.

### `db/stats.ts`
- `getPuzzleStats(slug)` — single KV read.
- `updatePuzzleStats(slug, moveCount, userId?)` — retry loop; handles `firstSolvedAt` (set once), `uniqueSolvers` (presence key dedup), histogram.
- `incrementHintUsageCount(slug)` — retry loop; increments `hintUsageCount` only if entry exists.

### `db/solutions.ts`
Calls `updatePuzzleStats(puzzleSlug, moves.length, payload.userId)` after commit (best-effort).

### `routes/puzzles/[slug]/hint.tsx`
Calls `incrementHintUsageCount(slug)` after hint is served (best-effort).

### `routes/puzzles/[slug]/index.tsx`
- GET: fetches `puzzleStats` in parallel with puzzle; coalesces to `defaultPuzzleStats`.
- `PageData.puzzleStats` is `PuzzleStats` (non-null).

### `islands/solution-dialog.tsx`
- Accepts `stats: PuzzleStats` (non-null).
- `StatsMessage` renders one of four messages based on histogram + percentile.
