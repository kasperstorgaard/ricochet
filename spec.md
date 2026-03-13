# Hint Dialog

## Why

Two problems with the previous hint system:
1. The solver could timeout or OOM with no feedback — the user had no idea what was happening
2. A bare redirect gave no context — users got one hint per puzzle per day with no explanation of what they were seeing

## What changed

### Hint flow

The hint route (`routes/puzzles/[slug]/hint.tsx`) no longer solves inline. It now:
- Validates the hint limit (1/day for medium+, 3/day for easy)
- Tracks `hint_requested` in PostHog
- Increments the hint usage counter
- Redirects back to the puzzle with `?dialog=hint` — no solve, no moves in the URL

The actual solve happens client-side on demand, triggered by the dialog opening.

### SSE solve endpoint (`routes/api/solve.ts`)

New POST endpoint that runs the solver in a Deno Worker and streams `SolverEvent`s back as SSE:
- `{ type: "progress", depth }` — emitted before each IDA* threshold pass
- `{ type: "solution", moves }` — emitted when solved
- `{ type: "error", message }` — emitted on failure
- Worker is terminated on stream cancel (client disconnect or abort)

### Solver worker (`game/solver-worker.ts`)

Thin worker wrapper — receives a `Board`, runs `solve()` as a generator, posts each event back. Runs in its own thread so the main server loop is not blocked.

### Client stream hook (`client/use-solve-stream.ts`)

`useSolveStream(onEvent)` — streams solver events from `/api/solve`:
- Accepts a board, POSTs it, reads the SSE response
- Cancels in-flight requests on re-call or unmount via `AbortController`

### Delayed value queue (`client/use-delayed-value.ts`)

`useDelayedValue<T>` — queues values and drains them one at a time on a configurable delay. Used by the hint dialog to pace the solver progress display:
- `queueValue(value, { delay })` — enqueues with a per-item delay
- `queueValue(value, { immediate: true })` — clears queue and sets immediately
- `clearQueue()` — cancels pending timers and empties the queue

### Hint dialog (`islands/hint-dialog.tsx`)

New dialog with four states driven by `useDelayedValue<SolveState>`:

| State | Shown when |
|-------|-----------|
| `starting` | Dialog opens — solver warming up |
| `solving` | Progress events arriving — depth ticking |
| `done` | Solution found |
| `error` | Solver failed |

**Pacing** (intentional artificial delays — solver is near-instant):
- `starting` → first depth: 1600ms for depth ≤ 2, else 800ms
- each subsequent depth tick: 800ms
- solution reveal: 1200ms (hint URL also set at this point)

The hint (first move of optimal solution) is written to `?hint=` in the URL only when the `done` state is displayed — so cancel before that means no hint shown.

**Off-track detection**: if `moves made + remaining > minMoves + 2`, shows a separate screen explaining the detour with total moves vs optimal, plus the hint still highlighted.

**Copy:**
- Starting: "Warming up the solver… / Crunching your moves…"
- Solving: "Finding the shortest path… / Trying all {n}-move paths from here…"
- Done: "Found it - {n} moves to go / First move highlighted, the rest is on you"
- Off-track: "You've gone a bit off track / You can still solve the puzzle, but you'll need {total} moves total (optimal is {min})"
- Error: "Something went wrong / The solver couldn't find a solution. Try again later."

### Difficulty badge (`islands/difficulty-badge.tsx`)

Always renders both slots (difficulty label + move count). When `minMoves` is unknown shows `"?"`. Error shown in tooltip rather than red background takeover.

## Files changed

| File | Change |
|------|--------|
| `routes/puzzles/[slug]/hint.tsx` | Remove inline solve; redirect to `?dialog=hint` |
| `routes/api/solve.ts` | New SSE endpoint — worker-based streaming solver |
| `game/solver-worker.ts` | New worker — runs `solve()` generator, posts events |
| `client/use-solve-stream.ts` | New hook — streams solver events from `/api/solve` |
| `client/use-delayed-value.ts` | New hook — queues values with per-item delays |
| `islands/hint-dialog.tsx` | New dialog with 4 states, paced reveal, off-track detection |
| `islands/difficulty-badge.tsx` | Always render both slots; `"?"` when minMoves unknown |
| `islands/solution-dialog.tsx` | Related dialog updates |
| `db/solutions.ts` | Related DB updates |
| `db/types.ts` | Related type updates |
| `routes/puzzles/[slug]/index.tsx` | Wire up HintDialog |
