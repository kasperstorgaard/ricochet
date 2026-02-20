# Ricochet — Agent Guidelines

A sliding-piece puzzle game (Ricochet Robots-inspired) built with Deno + Fresh 2 + Preact.

## Commands

```bash
deno task dev            # Dev server with file watching
deno task build          # Production build
deno task preview        # Preview production build

deno fmt                 # Format code (Deno's built-in formatter)
deno lint                # Lint (fresh + recommended rules)
deno test -A             # Run all unit tests

deno task update-puzzles # Regenerate puzzle manifest after adding puzzles
```

CI runs: `deno fmt --check`, `deno lint`, `deno test -A`.

## Project Layout

```
routes/          File-system routing (pages + API endpoints)
islands/         Interactive Preact components — hydrated client-side
components/      Static server-rendered components — no client JS
lib/             Client-side logic (input handling, replay, routing, analytics)
util/            Core game logic — shared server + client (board, solver, parser)
db/              Deno KV operations
static/puzzles/  Puzzle definitions (.md files with ASCII boards)
plugins/         Vite plugins (puzzle manifest generation)
```

## Key Architecture Rules

**Fresh 2 islands pattern**: Only components in `islands/` are hydrated client-side. `components/` is server-only. Put interactivity in islands, layout/markup in components.

**Where logic lives**:
- `util/` — pure game logic, no browser APIs, safe to import server-side
- `lib/` — client-side only (DOM, touch, signals, browser state)
- `db/` — Deno KV access, server-side only

**Import alias**: Use `#/` for project-root imports (e.g., `import type { Board } from "#/util/types.ts"`).

**State management**: Preact Signals for reactive island state. URL query string for persistent/shareable state (see `lib/router.ts`).

## Core Types

All domain types are in `util/types.ts`. Key types:
- `Board` — `{ destination: Position, walls: Wall[], pieces: Piece[] }`
- `Piece` — `Position & { type: "rook" | "bouncer" }`
- `Wall` — `Position & { orientation: "horizontal" | "vertical" }`
- `Move` — `[Position, Position]` (from → to)
- `Puzzle` — `{ slug, name, board, createdAt, difficulty? }`

## Adding Puzzles

Create `static/puzzles/<slug>.md` with YAML frontmatter + ASCII board:

```markdown
---
name: My Puzzle
slug: my-puzzle
createdAt: 2025-06-15T00:00:00.000Z
---

+ A B C D E F G H +
1 #     #         |
2   X             |
3                 |
4         @       |
+-----------------+
```

Symbols: `X` = rook (player piece), `@` = destination, `#` = bouncer, `|`/`_` = walls.

Run `deno task update-puzzles` after adding puzzles to regenerate the manifest.

## Styling

Always use Tailwind utility classes. Do not add to `styles.css` unless working on the design system itself or fixing a global UI bug that genuinely cannot be handled with utilities. Tailwind v4 has no config file — CSS-first configuration. Open Props design tokens are available as CSS custom properties. Use `clsx` for conditional class composition.

## Components

Prefer generic, reusable components over purpose-built ones. Reach for HTML semantics and native elements first — they give you accessibility for free and keep things simple. Avoid custom implementations of things the browser already does (focus management, form validation, disclosure, etc.).

## Routing & Data

**Server side is the default.** Use page-level `GET`/`POST` handlers in `routes/` as the first approach — they handle state via cookies and headers without any client-side wiring. Only create a route under `routes/api/` when the endpoint needs to be called client-side and is genuinely reusable across multiple pages or islands.

For storage: cookies and headers are the default. Only reach for client-side storage if server-side approaches are genuinely insufficient for the use case.

## Tests

Keep assertions minimal — prefer a single deep equality check over multiple individual property assertions. Write realistic tests that exercise meaningful scenarios end-to-end; don't write separate tests for trivial edge cases or guard against things that can't happen in practice. A test that mirrors real usage is more valuable than exhaustive coverage of impossible states.

## Comments

- `//` for short inline notes on non-obvious logic
- `/**\n * ...\n */` (multi-line) for documentation on exported functions and types
- Never use `/** single line */` — either `//` or a proper multi-line block

## Analytics (PostHog)

PostHog serves two purposes:
- **Feature flags** — used to ship features incrementally and run A/B experiments
- **Behavioral tracking** — core user events are tracked server-side via `posthog-node`; client-side PostHog (`posthog-js`) is limited to default pageview tracking and session replay only

If an interaction is not important enough to trigger a server-side handler or state change, it is not important enough to track.

## Tech Notes

- **Deno KV** (unstable): Enabled via `"unstable": ["kv"]` in deno.json.
- **BFS Solver** (`util/solver.ts`): Throws `SolverLimitExceededError` / `SolverDepthExceededError` on unsolvable/too-complex boards.
- **Progressive enhancement**: Game works fully server-side without JavaScript. Don't break this.
