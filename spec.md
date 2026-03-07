# Solution stats in dialog

## Context

The solution dialog currently shows generic copy after solving. We have the data
to show meaningful stats based on other players' solutions — making the moment feel
more rewarding and social without requiring a leaderboard page.

## Stats (priority order)

1. **Unique optimal** — "You're the first to solve it this way"
   - Only shown if `moves.length === puzzle.minMoves` AND sequence count = 1
   - Queries `solutions_by_puzzle_sequence` to check uniqueness

2. **Beat the majority** — "You solved it faster than X% of players"
   - Shown if the user's percentile is ≥ 60% (i.e. they beat at least 60% of solvers)
   - Based on move count vs all existing solutions

3. **Neutral fallback** — "Join X others who've solved this"
   - Always shown when stats 1 and 2 don't apply
   - Shows total solver count; skipped if no solutions yet (first solver, non-optimal)

## Data

Stats are derived from two sources:

- `sequenceCount` — `listPuzzleSolutions(slug, { bySequence: moves, limit: 2 })`, cheap prefix scan
- `totalSolutions` + `fasterThanCount` — read from `["puzzle_stats", slug]` KV key (see below)

The move sequence comes from the URL state (`decodeState`), already available in GET.

### KV key: `["puzzle_stats", slug]`

```ts
type PuzzleStats = {
  totalSolutions: number;
  solutionsHistogram: Record<number, number>; // moveCount → frequency
  firstSolvedAt?: string;  // ISO date, set on first solve
  uniqueSolvers: number;   // deduplicated via presence key when userId present
  hintUsageCount: number;
};
```

### KV key: `["puzzle_solvers", slug, userId]`

Presence key (value: `true`) used to deduplicate `uniqueSolvers`. Checked atomically
alongside the stats update — if absent, increment `uniqueSolvers` and set this key
in the same atomic commit. Anonymous sessions (no `userId`) always increment the counter.

Updated as a best-effort fire-and-forget after each solution write in `addSolution`.
Stats may drift slightly but are self-correcting — a lost solution is serious, a stale
histogram is not. Retry loop handles KV optimistic concurrency conflicts.

`hintUsageCount` is incremented separately from the hint route (`incrementHintUsageCount`),
also best-effort. Skipped if no stats entry exists yet (hints before first solve).

## Files changed

### `db/types.ts`
`PuzzleStats` type with full shape (see above).

### `db/stats.ts`
- `getPuzzleStats(slug)` — single KV read.
- `updatePuzzleStats(slug, moveCount, userId?)` — retry loop; handles `firstSolvedAt` (set once), `uniqueSolvers` (presence key dedup), histogram.
- `incrementHintUsageCount(slug)` — retry loop; increments `hintUsageCount` only if stats entry already exists.

### `db/solutions.ts`
- Calls `updatePuzzleStats(puzzleSlug, moves.length, payload.userId)` after `addSolution` commits (best-effort).

### `routes/puzzles/[slug]/hint.tsx`
- Calls `incrementHintUsageCount(slug)` after hint is served (best-effort).

### `routes/puzzles/[slug]/index.tsx`
- Decodes moves from URL in GET handler.
- Fetches sequence count and puzzle stats in parallel.
- Computes `fasterThanCount` from histogram.
- Passes `solutionStats: { sequenceCount, totalSolutions, fasterThanCount }` as page data.
- Skips stats fetch for `preview` slug.

### `islands/solution-dialog.tsx`
- Accepts `solutionStats` prop.
- Renders the appropriate stat message above the form.
