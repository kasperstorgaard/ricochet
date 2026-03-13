# Solve Dialog (Preview)

## Why

The editor's "solve" button previously had no feedback while the solver ran — it either returned instantly or hung. This PR brings the solve dialog in line with the hint dialog: streamed progress, paced reveal, error state.

## What changed

### Solve route (`routes/puzzles/[slug]/solve.tsx`)

New GET handler — validates the request is for `preview` (or dev), then redirects to `?dialog=solve`. No inline solve — mirrors the hint route pattern.

### Solve dialog (`islands/solve-dialog.tsx`)

Rebuilt to match hint dialog structure and behaviour:

- Uses `useDelayedValue<SolveState>` for paced reveal (500ms per tick, 500ms on done)
- Four states: `starting`, `solving`, `done`, `error`
- URL update (moves + cursor) happens via a `useEffect` on `solveState` reaching `done`, keeping it decoupled from the stream handler
- Copy aligned with hint dialog: "Warming up the solver… / Crunching your moves…", "Trying all {n}-move paths from here…"
- Done: "Found it - {n} moves total / Use the control panel undo/redo to see it"
- Delays are shorter than hint dialog (500ms vs 800ms) — solve is a dev/editor tool, less ceremony needed

### Controls panel (`islands/controls-panel.tsx`)

Solve button wired to the new route.

### Puzzle page (`routes/puzzles/[slug]/index.tsx`, `game/url.ts`)

`SolveDialog` mounted on the puzzle page; URL state updated to support `?dialog=solve`.

## Files changed

| File | Change |
|------|--------|
| `routes/puzzles/[slug]/solve.tsx` | New route — redirects to `?dialog=solve` |
| `islands/solve-dialog.tsx` | Rebuilt with streamed progress, paced reveal, error state |
| `islands/controls-panel.tsx` | Wire solve button to new route |
| `routes/puzzles/[slug]/index.tsx` | Mount SolveDialog |
| `game/url.ts` | URL state support for solve dialog |
