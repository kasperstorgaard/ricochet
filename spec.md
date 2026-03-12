# Solver + hints + dialog revamp

## Overview

Three loosely related areas shipped together:

1. **IDA* solver** — replaces BFS/A*, fixes OOM and event loop blocking
2. **Client-side hint/solve streaming** — hints are now fully client-side with live progress
3. **Dialog fix** — native `<form method="dialog">` was fighting Preact's VDOM, causing dialogs to stick in the top layer

---

## 1. IDA* solver

### Problem
BFS/A* stored millions of state entries → OOM crash. Even with a Web Worker, the sync loop blocked Deno's event loop.

### Fix
Replaced with IDA* (Iterative Deepening A*). O(depth) memory — no states array.
Within-pass transposition table prevents re-exploration per threshold pass.

Admissible heuristic: h=0 (at dest), h=1 (same row/col), h=2 (neither).

`SolverLimitExceededError` removed — only a depth limit remains. `solve()` is now a synchronous generator yielding `SolverEvent`s.

### Files
- `game/solver.ts` — IDA* rewrite
- `game/solver_test.ts` — updated assertions

---

## 2. Hint/solve streaming

### Architecture
```
component → useSolveStream hook → POST /api/solve → Deno worker → IDA* solver
                                      ← SSE stream ←
```

The server spins up a Deno Web Worker per request (browser can't run `.ts` files). Browser workers were tried but Fresh 2's Vite setup doesn't bundle worker files.

### `useSolveStream` hook (`client/use-solve-stream.ts`)
Replaces raw `(async () => { for await ... })()` in islands. Provides:
- `start(board)` — cancels in-flight, starts new SSE stream via `AbortController`
- `cancel()` — aborts cleanly
- Auto-cancels on unmount

### Hint dialog (`islands/hint-dialog.tsx`)
New island (was server-rendered). Always streams client-side — no server solve.
Server route does rate limiting + analytics then redirects immediately to `?dialog=hint`.

Shows:
- Searching depth N… (live progress)
- Solution found in N more moves (hint move highlighted on board)
- Off-track: "you need N total moves but this puzzle has M" + restart offer

### Solve dialog (`islands/solve-dialog.tsx`)
New island for preview/editor. Streams a full solution on demand.

### Solve route (`routes/puzzles/[slug]/solve.tsx`)
New server route — triggers the solve dialog via `?dialog=solve` redirect.

### KV solve caching removed
`addSolve`, `listPuzzleSolves`, `getPuzzleSolve`, `Solve` type — all deleted.

### No-JS: hint/solve hidden
Hint and Solve links use `className="noscript:hidden"` since they require client-side streaming.

### Files
- `client/use-solve-stream.ts` — new hook
- `islands/hint-dialog.tsx` — new island
- `islands/solve-dialog.tsx` — new island
- `islands/difficulty-badge.tsx` — uses hook
- `routes/api/solve.ts` — SSE endpoint with worker
- `routes/puzzles/[slug]/hint.tsx` — fast redirect, no server solve
- `routes/puzzles/[slug]/solve.tsx` — new, triggers solve dialog
- `game/solver-worker.ts` — worker entry point
- `db/solutions.ts` — removed solve caching
- `db/types.ts` — removed `Solve` type
- `game/url.ts` — added `getSolveHref`, `getResetHref` clears `dialog` param
- `islands/controls-panel.tsx` — noscript:hidden on hint/solve links
- `scripts/update-puzzles.ts` — new script, solves puzzles to populate `minMoves`
- `deno.json` — added `update-puzzles` task

---

## 3. Dialog fix

### Problem
`<form method="dialog">` closed the native `<dialog>` immediately while Preact's `open` prop was still `true`. On the next render, `useLayoutEffect` re-called `showModal()`, putting the dialog back in the top layer with `open=false` — invisible but blocking clicks.

### Fix
- All close buttons are plain `<button type="button">` — no native form-based close
- `SolutionDialog` tracks `dismissed` state; set on close, reset when user plays again
- `Dialog` component: `open` attribute is SSR-only (`useState(open)` cleared on first `useLayoutEffect`) — after hydration, only `showModal()`/`close()` drive state, Preact never manages the attribute again
- CSS: transitions use `dialog:modal` (true only after `showModal()`) instead of `dialog[open]`; `[data-js] dialog[data-modal][open]:not(:modal)` hides the SSR non-modal dialog instantly to prevent FOUC during the `showModal()` upgrade

### Files
- `islands/dialog.tsx` — ssrOpen pattern
- `islands/solution-dialog.tsx` — dismissed state
- `islands/hint-dialog.tsx` — plain button closes
- `islands/solve-dialog.tsx` — plain button closes
- `styles.css` — dialog:modal transitions, [data-js] FOUC guard

---

## 4. Editor cleanup

Generator no longer runs the solver to validate `solveRange` — generation just validates the board and returns. `minMoves` is set to 0 until the puzzle manifest is regenerated. Generate options UI simplified (no more solveRange / wallSpread controls).

### Files
- `game/generator.ts` — removed `solveRange`, solver call
- `islands/editor-panel.tsx` — simplified generate UI, added clear board button
- `routes/api/generate.ts` — no longer returns `moves`
- `islands/router.tsx` — minor fix
- `routes/api/puzzles.ts` — minor fix
- `routes/puzzles/[slug]/index.tsx` — minor fix
- `routes/puzzles/[slug]/solutions/index.tsx` — minor fix
