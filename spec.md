# Solutions panel revamp

## Context

The solutions panel currently shows a flat list of all posted solutions ordered
by move count. At scale this fills with near-duplicates — same moves in a
different order, or the same person submitting twice.

## Vision

A curated list of truly unique approaches. Each entry represents a distinct set
of moves; reorderings of the same moves collapse into one. The panel becomes
a meaningful catalogue of how different people solved the puzzle.

## Deduplication

Two solutions are equivalent if they use the **same set of moves regardless of
order** — same pieces moved to the same destinations, just sequenced differently.

Canonical key: sort the encoded moves lexicographically, join into a single
string. Computed at read time (no new KV index needed for MVP).

## List format

- One row per unique canonical group.
- Ordered by move count (fewest first), then earliest submission within group.
- Each row: `{move count}  {name}  [+ N others]`
  — "N others" only shown if the group has > 1 solution.
- The name shown is the first (earliest) submitter of that canonical group.

## Current solution placement (solution page)

When viewing `/puzzles/[slug]/solutions/[id]`, the current solution's group is
always visible in the list, with `...` separators above and/or below to indicate
it's scrolled into view:

```
3  Alice
4  Bob
...
7  You          ← current
...
9  Carol + 2 others
```

## User's own solutions

Solutions belonging to the current user are highlighted across the list — a user
could appear in multiple groups if they solved it multiple times with different
approaches. Visual treatment TBD (e.g. subtle background tint or name styling).
Requires `userId` on `Solution` (already present).

## Layout

On the solution/replay page, the board can be scaled down slightly to give the
panel more breathing room — the board is decorative here (replay only), not
interactive.

Consider whether the panel needs a scroll container for puzzles with many unique
solutions.

## Write-time deduplication

Before saving a new solution, check whether the user already has a submission
with the same canonical key for this puzzle. If so, skip the write and return
the existing solution instead.

Check: fetch `listUserPuzzleSolutions(userId, slug, { limit: 100 })`, compute
canonical key for each, compare against the incoming submission. A user will
rarely have more than a handful of solutions per puzzle so this is fine in-memory.

The solution dialog must handle the "already posted" case: hide the form and
show a link to the existing solution instead — "You've already posted this
solution — view it here."

This requires the GET handler to pass `existingSolution: Solution | null` as
page data when the current moves match an existing canonical submission.

## Open questions

- How many unique groups to show by default? (Currently top 6 — show more if
  panel height allows; consider a scroll container.)

## Files to change

### `game/strings.ts`
Add `getCanonicalMoveKey(moves: Move[]): string` — sorts and encodes moves into
a stable deduplication key.

### `db/solutions.ts`
- `getCanonicalUserSolution(userId, slug, moves)` — checks existing user
  solutions for a canonical match, returns the matching solution or null.

### `routes/puzzles/[slug]/index.tsx`
- GET: compute canonical key from URL moves, call `getCanonicalUserSolution`,
  pass `existingSolution` as page data.
- POST: call `getCanonicalUserSolution` before `addSolution`; if match found,
  redirect to `/puzzles/[slug]/solutions/[existingId]` instead of saving.

### `islands/solution-dialog.tsx`
- Accept `existingSolution: Solution | null` prop.
- If set, replace the form with "You've already posted this solution — view it."

### `islands/solutions-panel.tsx`
- Group solutions by canonical key before rendering.
- Render grouped list with `+ N others` counts.
- Highlight current user's groups.
- Show `...` separators around the active solution.

### Solution page route / layout
- Shrink board slightly to give panel more space.
