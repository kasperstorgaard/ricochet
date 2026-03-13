# Solve Dialog + Worker Solver

## What

A "solve from here" dialog for the puzzle page, plus a TypeScript worker-based solver
so SSE streaming actually flushes in real time. The core algorithm is RBFS (Recursive
Best-First Search), which is faster than IDA* in practice.

## Why

- The existing solver ran inline, blocking the server event loop — SSE chunks buffered
  until fully done, no streaming.
- RBFS re-expands far fewer nodes than IDA*. IDA* re-expands all depth-d states at
  each new threshold pass. RBFS stores per-successor f-values and only re-expands a
  branch when a sibling's f drops below it — much less redundant work.
- The solve dialog gives players a way to step through the optimal path from their
  current position using existing undo/redo controls.

## Algorithm: RBFS

RBFS is a memory-efficient variant of A*:

```
rbfs(state, g, myF, fLimit):
  if myF > fLimit: return (null, myF)         # exceeded — tell parent
  if state is goal: return (path, 0)
  if g >= maxDepth: return (null, ∞)

  successors = expand(state)
  each successor: f = max(g+1 + h, myF)       # inherit parent f if higher

  loop:
    best = min-f successor
    if best.f > fLimit: return (null, best.f)
    alt = second-min f
    result, best.f = rbfs(best, g+1, best.f, min(fLimit, alt))
    if result: return (result, _)
```

Heuristic: 0 (puck at dest), 1 (same row or col), 2 (otherwise). Admissible; does not
check walls (cost > benefit per node).

## Data structures

All hot paths use compact representations to minimise allocations:

- **State**: `Uint8Array [puckPos, ...blockersSortedAsc]` — positions as `y*8+x`.
  Canonical order maintained by `applyMove` (insertion sort on the changed element),
  so no sort in `stateKey`.
- **Wall index**: `hWalls[x]` = y-values of horizontal walls in column x;
  `vWalls[y]` = x-values of vertical walls in row y. Each piece only iterates its
  own row/column, not all walls.
- **Move pairs**: flat `[from, to, from, to, …]` — better cache locality than
  array of objects.
- Integer division with `| 0` throughout instead of `Math.floor`.

## Changes

### `game/solver.ts`

Full rewrite — same public interface (`SolverEvent`, `solve()`, `solveSync()`), new
internals:

- `Uint8Array` state + `indexWalls` + `getMoves` (inlined; no longer calls `getTargets`)
- `rbfs()` — recursive RBFS, returns `{ found, moves | nextF }`
- `solve()` generator: yields one `{ type: "progress", depth: 1 }` to signal start,
  then runs `rbfs()` synchronously, yields `{ type: "solution", moves }`
- `solveSync()` unchanged semantically; options now optional in both

`SolverDepthExceededError` is still thrown when `maxDepth` is reached with no solution.
`getTargets` import removed; `COLS` / `ROWS` still imported from `board.ts`.

### `game/solver-worker.ts` (new)

TypeScript worker that imports `solve` from `solver.ts` and posts `SolverEvent`
messages back to the main thread.

### `routes/api/solve.ts`

Worker URL changed from static JS to TypeScript:

```ts
const workerUrl = new URL("../../game/solver-worker.ts", import.meta.url);
```

`import.meta.url` is correct here: `routes/api/solve.ts` is server-side code executed
directly by Deno — not bundled by Vite — so the URL resolves to the source file on
both local Deno and Deno Deploy.

### `static/solver-worker.js` (deleted)

Replaced by `game/solver-worker.ts`.

## Solve dialog (`islands/solve-dialog.tsx`)

- Computes current `board` from `puzzle.value.board` + moves via `resolveMoves` (memo)
- Re-runs solver on `[open, board]` change
- Uses `useDelayedValue<SolveState>` with 500 ms delays
- On done: appends solution moves to URL via `updateLocation` for undo/redo replay

States and copy:

| State | Headline | Body |
|---|---|---|
| starting | Warming up the solver… | Crunching your moves… |
| solving | Finding the shortest path… | Trying all {n}-move paths from here… |
| done | Found it — {n} moves total | Use the control panel undo/redo to see it |
| error | Something went wrong | The solver couldn't find a solution. Try again later. |

### `islands/difficulty-badge.tsx`

Fixed `useEffect` dependency bug: the effect watched local `minMoves` state instead of
`puzzle.value.board` and `puzzle.value.minMoves`, so it never re-ran on board changes.
