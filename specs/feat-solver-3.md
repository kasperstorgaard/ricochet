# Solver Rewrite + Worker Bundling

## What

BFS solver replacing the old IDA* implementation, running in a Web Worker so SSE
progress events flush in real time. Includes a "solve from here" dialog that steps
through the optimal path via existing undo/redo controls.

## Why

- The old solver ran inline, blocking the server event loop — SSE chunks buffered until
  fully done.
- BFS guarantees the shortest solution and visits each state exactly once — no repeated
  work like IDA*.
- Workers on Deno Deploy can't load scripts from runtime-constructed `https://` URLs
  (`--cached-only` blocks them). Bundling the worker to a local file and referencing it
  via `import.meta.url` produces a `file://` URL that reads from disk directly.

## Algorithm: BFS

BFS visits each unique board state exactly once, guaranteeing the shortest solution.

```
bfs(board):
  enqueue initialState
  while queue not empty:
    state = dequeue
    for each move in getMoves(state):
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
- **Move buffer**: `Uint8Array(pieceCount * 8)` — reused each node; `getMoves` writes
  flat `[from, to, from, to, …]` pairs and returns the count.
- **Visited set**: `CompactSet` — open-addressing hash set backed by `Float64Array`.
  ~6× less memory than `Set<number>`; uses Fibonacci hashing and a 50% load factor.
- **Wall lookup**: `hWalls[x]` = y-values of horizontal walls in column x;
  `vWalls[y]` = x-values of vertical walls in row y. Built once; each piece only
  iterates its own row/column.

## Changes

### `game/solver.ts`

Full rewrite — same public interface (`SolverEvent`, `solve()`, `solveSync()`):

- `bfsSolve()` generator — BFS with flat typed array queue; `getMoves` + `applyMove` +
  `CompactSet` visited set; path via `reconstructPath` (parent pointers). Yields current
  depth at each level boundary so callers get real-time progress.
- `solve()` maps depth yields to `{ type: "progress", depth }` events, then emits
  `{ type: "solution", moves }` when done.
- `solveSync()` unchanged semantically.

### `lib/compact-set.ts` (new)

`CompactSet` extracted from `solver.ts` into `lib/` — generic open-addressing hash set
for non-negative numeric keys, no game-specific logic.

### `game/solver-worker.ts` (new)

Web Worker entry point — calls `solve()` and posts `SolverEvent` messages back to the
main thread. Catches solver errors and posts them as `{ type: "error" }`.

### `plugins/solver-worker.ts` (new)

Vite plugin that bundles `game/solver-worker.ts` via esbuild (`@deno/esbuild-plugin`):

- `buildStart`: writes the bundle to `static/solver-worker.js` (served as a static
  asset) and `routes/api/solver-worker.js` (so `import.meta.url` resolves correctly in
  dev mode, where it points to the source file).
- `closeBundle`: copies the bundle to `_fresh/server/assets/` alongside the compiled
  route for production.

### `routes/api/solve.ts`

Replaced inline `solve()` call with a Worker:

```ts
const workerUrl = new URL("./solver-worker.js", import.meta.url);
```

On Deno Deploy, `import.meta.url` is a `file://` URL — the compiled modules run from
the deployment's local filesystem. So the worker URL is also `file://`, which reads
from disk and bypasses the `--cached-only` restriction entirely. The `closeBundle` copy
ensures the file exists at that path.

### `islands/solve-dialog.tsx`

- Memoizes `board` via `resolveMoves(puzzle.value.board, moves)`
- Clears state before starting a new solve
- States: `starting` → `solving` (with depth) → `done` (moves appended to URL for
  undo/redo replay) or `error`

### `vite.config.ts`

Registers `solverWorker()` plugin.
