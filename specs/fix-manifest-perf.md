# Perf: loader file reads + home page parallelism

## Problem

Every call to `getPuzzle` and `getPuzzleManifest` in `game/loader.ts` used `fetch()` against `ctx.url.origin` — meaning each one was a full outbound network round-trip. On Deno Deploy this exits the isolate, hits the network, and comes back.

The home page made at least 4 such round-trips in a suboptimal order:

1. `GET manifest.json` → pick daily entry
2. `GET daily.md`
3. *(await steps 1-2 before starting below)*
4. `GET manifest.json` **again** (via `getRandomPuzzle`) + KV list in parallel
5. `GET random.md`

## What was built

### Loader: file reads + manifest cache (`game/loader.ts`)

Replaced `fetch()` in `getPuzzleManifest` and `getPuzzle` with `Deno.readTextFile()`. Files at `static/puzzles/` are bundled with the deployment and readable on Deno Deploy just as locally.

Path resolved via `import.meta.url` (module-relative, safe regardless of cwd):
```ts
const PUZZLES_DIR = new URL("../static/puzzles", import.meta.url).pathname;
```

The parsed manifest is cached in a module-level variable after first read — it's static, never changes between requests, so repeated calls to `getAvailableEntries()` (e.g. from `getLatestPuzzle` + `getRandomPuzzle` in the same request) are essentially free.

`baseUrl` parameter removed from all exported loader functions — it was only needed to construct fetch URLs.

### Home page handler (`routes/index.tsx`)

`getLatestPuzzle()` and `listUserSolutions()` now run in parallel. The companion puzzle (`getRandomPuzzle` or `getPuzzle("karla")`) follows once the daily slug is known — but since manifest reads are cached, the second `getAvailableEntries()` call inside `getRandomPuzzle` is a memory lookup.

### All route callers

Dropped the `ctx.url.origin` argument from every `getPuzzle`, `getLatestPuzzle`, `listPuzzles`, and `getRandomPuzzle` call across all routes.

### `getBestMoves` moved to `db/solutions.ts`

Extracted the per-puzzle best-move aggregation into `getBestMoves(solutions: Solution[])` in `db/solutions.ts` — where solution data lives. Removed the generic key function; `puzzleSlug` is the only key that makes sense here.
