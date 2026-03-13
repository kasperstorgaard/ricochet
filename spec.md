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

## Algorithm: BFS

BFS visits each unique board state exactly once, guaranteeing the shortest solution.
It is faster than IDA*/RBFS in practice because there is no repeated work — each state
is enqueued once and dequeued once.

```
bfs(board):
  enqueue initialState
  while queue not empty:
    state = dequeue
    for each move in enumerateMoves(state):
      next = applyMove(state, move)
      if visited(next): skip
      mark visited
      if next is goal: reconstruct path via parent pointers
      enqueue next
```

Path is reconstructed by following `parentIndexes` back to the root rather than storing
the full move history in every entry.

Throws `SolverDepthExceededError` if the queue exceeds `BFS_STATE_LIMIT` (10M states)
or if `maxDepth` is reached without finding a solution.

## Data structures

All allocations happen once before the BFS loop — nothing is allocated per state:

- **State pool**: `Uint8Array(BFS_STATE_LIMIT * pieceCount)` — all BFS states packed
  flat. Each state is `[puckPos, ...blockersSortedAsc]` with positions as `y*COLS+x`.
  Canonical blocker order is maintained by `applyMove` (insertion sort on the moved
  piece), so `stateKey` never needs to sort.
- **Metadata arrays**: parallel `Int32Array`/`Uint8Array` for `parentIndexes`,
  `fromPositions`, `toPositions`, `depths` — one entry per queued state, no heap
  objects.
- **Move buffer**: `Uint8Array(pieceCount * 8)` — reused each node; `enumerateMoves`
  writes flat `[from, to, from, to, …]` pairs and returns the count.
- **Visited set**: `CompactSet` — open-addressing hash set backed by `Float64Array`.
  ~6× less memory than `Set<number>`; uses Fibonacci hashing and a 50% load factor.
- **Wall lookup**: `hWalls[x]` = y-values of horizontal walls in column x;
  `vWalls[y]` = x-values of vertical walls in row y. Built once; each piece only
  iterates its own row/column.
- Integer division with `| 0` throughout instead of `Math.floor`.

## Changes

### `game/solver.ts`

Full rewrite — same public interface (`SolverEvent`, `solve()`, `solveSync()`), new
internals:

- `bfsSolve()` — BFS with flat typed array queue; `enumerateMoves` + `applyMove` +
  `CompactSet` visited set; path via `reconstructPath` (parent pointers)
- `solve()` generator: yields one `{ type: "progress", depth: 1 }` to signal start
  to the worker UI, then runs `bfsSolve()` synchronously, yields `{ type: "solution", moves }`
- `solveSync()` unchanged semantically; options now optional in both

`SolverDepthExceededError` is thrown when `maxDepth` or `BFS_STATE_LIMIT` is exceeded.
`getTargets` import removed; `COLS` / `ROWS` still imported from `board.ts`.

### `lib/compact-set.ts` (new)

`CompactSet` extracted from `solver.ts` into `lib/` — generic enough for any non-negative
numeric keys, no game-specific logic.

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
