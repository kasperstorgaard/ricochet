# Spec: Puzzle hint system

## Context

Players sometimes get stuck on hard puzzles with no way to get unstuck short of giving up. A lightweight hint system would reduce frustration while preserving the satisfaction of solving.

## Plan

### 1. `game/hints.ts` — hint generation

Add a `getHint(board: Board, moves: Move[]): Move` function that runs the BFS solver and returns the next optimal move from the solution path. If the player has already made moves, find the closest solution from the current state.

### 2. `routes/api/hint.ts` — hint endpoint

`POST /api/hint` accepts `{ slug, moves }` and returns `{ from: Position, to: Position }`.

Rate-limit to 3 hints per puzzle per session (tracked in a cookie). Return 429 if exhausted.

### 3. `islands/game-board.tsx` — hint UI

Add a "Hint" button in the toolbar. On click, POST to `/api/hint` and highlight the piece that should move next (pulse animation, 2s). Don't reveal the destination — just which piece to move.

Disable the button while a hint is in flight. Show remaining hint count as a small badge (`2 left`).

### 4. Cookie schema

```
hint_counts = { [slug]: number }   // hints used per puzzle
```

Set as `HttpOnly; SameSite=Strict; Max-Age=86400`.

## Out of scope

- Showing the full solution path
- Hints on the tutorial puzzle
- Persisting hint usage to KV (cookie-only for now)
