# BFS solver — performance + streaming

## Problem

The BFS solver times out on hard puzzles. Two complementary fixes:
1. Reduce memory/CPU pressure so more states can be explored within limits
2. Stream progress back to the client so hard solves don't feel like a hang

---

## Part 1: Solver optimisation

### Root cause

Every queue entry stores a full copy of the move history:
```ts
queue.push({ pieces: newPieces, moves: [...current.moves, move] });
```
At depth 15 with branching factor ~12, this creates millions of array allocations
and puts heavy pressure on the GC.

### Fix: parent pointers

Store each state in a flat array. Instead of carrying moves, each entry points
back to its parent index. Reconstruct the path only when a solution is found.

```ts
type Entry = { pieces: CompactPiece[]; parentIdx: number; move: Move | null };
const states: Entry[] = [{ pieces: initialPieces, parentIdx: -1, move: null }];
```

On solution found, walk back through `parentIdx` chain and reverse to get moves.

Secondary: make `generateAllMoves` work on `CompactPiece[]` directly to avoid
the `fromCompact` conversion on every state.

### What stays the same

- BFS — still finds the optimal (minimum move) solution
- `SolverLimitExceededError` / `SolverDepthExceededError` — same error API
- `solve()` signature — same input/output

---

## Part 2: Streaming endpoint

### Motivation

Hard puzzles can take seconds. Instead of a silent hang + timeout, stream
progress so the editor can show what's happening.

### New endpoint: `POST /api/solve/stream`

Returns a `text/event-stream` (SSE) response. Events:

```
event: progress
data: {"depth": 8, "states": 42381}

event: solution
data: {"moves": [[...], [...]]}

event: error
data: {"message": "Solver limit exceeded"}
```

The solver is adapted into an async generator that yields after each depth
level completes:

```ts
async function* solveStream(board: Board, options): AsyncGenerator<SolverEvent>
```

At each BFS depth boundary, yield a `progress` event. On solution found, yield
`solution` and return. On limit/depth exceeded, yield `error`.

### Client (puzzle editor island)

Switches from `fetch POST /api/solve` to `EventSource POST` (or fetch + reader).
Shows depth progress in the UI while solving. Displays solution on `solution`
event, error message on `error` event.

### Keep existing `POST /api/solve`

Leave it for simple cases — the editor can use streaming only when it wants
live feedback. Both endpoints share the same underlying generator.

---

## Files changed

### Part 1
- `game/solver.ts` — parent pointer BFS, compact move generation

### Part 2
- `game/solver.ts` — `solveStream` async generator alongside `solve`
- `routes/api/solve/stream.ts` — new SSE endpoint
- `islands/controls-panel.tsx` (or relevant editor island) — SSE client

---

## Out of scope

- Bidirectional BFS or A* (complexity not justified yet)
- Pre-computed wall bitfields (profile first)
- Persisting solve results (separate concern)
