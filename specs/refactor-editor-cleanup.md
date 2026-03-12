# Editor Cleanup

## Why

The puzzle generator previously ran the BFS solver on every candidate board to
filter by move count (`solveRange`). On complex boards this caused OOM crashes
and mutex deadlocks in Deno. More importantly, it was the wrong model: the
generator produces raw boards for inspiration, not finished puzzles. Solvability
and optimal move count are concerns for the human author, not the generator.

## What changed

### Remove solver from generator (`game/generator.ts`)

- Removed `solveRange: [number, number]` from `GenerateOptions`
- `generate()` no longer calls `solve()` — it validates board structure with
  `validateBoard()` and returns immediately
- No more imports of `solve`, `SolverDepthExceededError`, `SolverLimitExceededError`
- `generateBoard()` signature narrowed to `Pick<GenerateOptions, "wallsRange" | "blockersRange" | "wallSpread">`

### Simplify editor panel (`islands/editor-panel.tsx`)

- Removed configurable options UI: no wallSpread selector, no solveRange inputs,
  no `showOptions` toggle, no gear icon
- Removed `isGenerating` spinner state (generation is now instant)
- Generation options hardcoded as `GENERATE_OPTIONS = { wallsRange: [5, 15], blockersRange: [3, 5], wallSpread: "balanced" }`
- `onGenerate` no longer reads `moves` from response; sets `minMoves: 0`
- Added `onClear` callback — resets board to empty state (destination at `{x:3,y:3}`,
  no pieces, no walls)
- Added Clear button with Trash icon

### API response (`routes/api/generate.ts`)

- Response no longer includes `moves` — the generator doesn't produce them

### Tests (`game/generator_test.ts`)

- Updated to match new `GenerateOptions` shape (no `solveRange`)

### Populate `minMoves` separately (`scripts/update-puzzles.ts`, `deno.json`)

Solving puzzles is now a separate offline step, not part of the generation loop.

- New script `scripts/update-puzzles.ts` solves all puzzle files with missing or
  zero `minMoves` and writes the result back to the `.md` files
- Supports `UPDATE_ALL=1` env var to re-solve all puzzles unconditionally
- Registered as `deno task update-puzzles`

## Difficulty badge (`islands/difficulty-badge.tsx`)

- Error state no longer hijacks the whole badge with a red background + warning icon
- Badge always renders both slots: difficulty label (left) and move count (right)
- When there's an error: label shows `"error"`, right slot shows the Warning icon (with tooltip containing the error message); no red background
- When `minMoves` is zero/absent: right slot shows `"?"` instead of hiding
- Min-width of right slot widened from `2ch` to `3ch` to fit the `"?"` without layout shift

## Files changed

| File | Change |
|------|--------|
| `game/generator.ts` | Remove solver call, drop `solveRange` from options |
| `game/generator_test.ts` | Update test fixtures to new `GenerateOptions` shape |
| `islands/editor-panel.tsx` | Strip options UI, add Clear button, harden generate handler |
| `islands/difficulty-badge.tsx` | Always render both slots; show `"?"` when minMoves unknown; error in tooltip not background |
| `routes/api/generate.ts` | Drop `moves` from response |
| `scripts/update-puzzles.ts` | New — offline script to populate `minMoves` in puzzle files |
| `deno.json` | Add `update-puzzles` task |

## Not in scope

- Solver rewrite (separate PR)
- Hint / solve dialogs (separate PR)
- Client-side routing changes (separate PR)
