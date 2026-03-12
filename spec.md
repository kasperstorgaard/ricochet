# Solver Algorithm Refactor: BFS → IDA*

## Why

The original BFS solver stored the full frontier in memory, which caused OOM
crashes on hard puzzles (deep solutions, many pieces). IDA* uses O(depth) stack
memory — it re-explores nodes per pass but never blows the heap, making it
robust for complex boards where BFS dies.

Benchmark across 94 medium-difficulty puzzles: IDA* ~60s vs BFS ~55s — within
noise for this depth range. BFS is slightly faster on shallow solutions (its
sweet spot), but IDA* is expected to pull ahead or stay alive on hard puzzles
where BFS OOMs.

## What changed

### `game/solver.ts`

Replaced the BFS implementation with IDA* (Iterative Deepening A*):

- **Generator-based API**: `solve()` is now a sync generator yielding
  `SolverEvent` — `{ type: "progress", depth }` before each threshold pass,
  then `{ type: "solution", moves }` on success. Callers can stream progress or
  ignore it.
- **`solveSync()`** convenience wrapper — iterates the generator and returns
  `Move[]`, same ergonomics as the old `solve()`.
- **Heuristic**: `heuristicRank` returns 0 (at destination), 1 (same row or
  column), or 2 (needs ≥2 moves). Admissible — never overestimates. Walls
  intentionally ignored (cost of checking > benefit per node).
- **Within-pass transposition table**: a `Map<string, number>` tracks the
  minimum g-cost seen for each state in the current threshold pass. Prevents
  re-expanding states at equal or higher cost within a pass. Cleared between
  passes so memory stays bounded to the current pass, not cumulative search.
- **Compact piece representation**: pieces stored as `{ pos: number, type }`
  where `pos = y * COLS + x`. Avoids object allocation per state comparison.
- **`SolverDepthExceededError`** retained — thrown when `threshold > maxDepth`.
  Default `maxDepth` is 15.
- Removed: `SolverLimitExceededError` (no node-count limit in IDA*).

### `game/solver_test.ts`

- Updated to cover both `solve()` (generator) and `solveSync()` APIs
- Added `solve() yields progress then solution` test verifying event sequence
- Two complex multi-piece puzzle regression tests retained

## Files changed

| File | Change |
|------|--------|
| `game/solver.ts` | Replace BFS with IDA* generator; add `solveSync` wrapper; add transposition table and heuristic |
| `game/solver_test.ts` | Update tests for new API; add generator event test |
