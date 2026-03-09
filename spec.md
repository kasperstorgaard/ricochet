# Puzzle state validation + submit spinner

## Context

Three issues:
1. When a user submits a solution via POST that matches an existing solution, redirect
   back to the puzzle page with `?error=duplicate` so `SolutionDialog` can show an error.
2. Invalid game state in URLs crashes rendering client-side. Server should validate
   state and redirect to a safe URL.
3. The "Post solution" button has no loading feedback during form POST.

---

## 1. Duplicate solution — redirect with error param

POST handler in `routes/puzzles/[slug]/index.tsx`: if `existingSolution` is found,
redirect back to the referer puzzle URL with `?error=duplicate`.

`SolutionDialog` reads `error` from `href` URL and shows duplicate message
with link to `/puzzles/[slug]/solutions`. `existingSolution` prop removed entirely
from `PageData`, `SolutionDialog`, and the page component.

## 2. Invalid state redirect

Wrap `resolveMoves(puzzle.board, moves)` in try/catch in both:
- `routes/puzzles/[slug]/index.tsx` GET handler — redirects to `/puzzles/${slug}?error=invalid move`
- `routes/puzzles/[slug]/hint.tsx` GET handler — redirects to clean `/puzzles/${slug}`

## 3. Submit spinner

`islands/solution-dialog.tsx`: `isSubmitting` state (useState), set to `true` on form
submit, shows spinner icon and disables button while submitting.

---

## Files changed

- `routes/puzzles/[slug]/index.tsx` — invalid state redirect in GET; duplicate redirect in POST; remove `existingSolution` from `PageData`
- `routes/puzzles/[slug]/hint.tsx` — invalid state guard before `solve()`
- `islands/solution-dialog.tsx` — remove `existingSolution` prop + add spinner + read `error` param
