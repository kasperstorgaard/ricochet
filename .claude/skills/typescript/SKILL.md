---
name: typescript
description: TypeScript conventions — type design, inference-first, avoiding over-typing, assertion rules
---

# TypeScript approach

## Inference first

Prefer inferred return types — don't annotate what the compiler can already
figure out. Explicit return type annotations add value at public API boundaries
or when inference produces an unwanted widened type. Everywhere else, let the
compiler work.

## Type design

Compose types from primitives and intersections rather than building wrapper
types. Use discriminated unions over optional fields when a value can take
distinct shapes — it makes narrowing explicit and exhaustive checks possible.
Avoid adding type wrappers that carry no structural information.

## Assertions & casts

Prefer `const x: SomeType = value` over `return value as SomeType`. The
annotation form is checked; the cast form silences the compiler without
verifying correctness.

`as` is acceptable at function return sites where inference falls short and the
cast is genuinely safe. It is never acceptable as a substitute for proper typing
— if a cast is needed to make something compile, fix the type first.

## Functions

Helper functions are when a function is tightly coupled to the logic of one one
file and lives within that file. They are encouraged, and should always live _at
the end_ of the file to make the file easier to scan.

const function declarations are discouraged, except for /client side Preact
work.

## Generics

Generics earn their complexity only for core utilities or highly reusable types.
Don't parameterize something that only ever has one concrete use — a concrete
type is simpler to read and easier to change.

## Common pitfalls

Avoid:

- **`enum`** — use string union types instead (`type Direction = "up" | "down"`)
- **`interface`** — prefer `type` aliases; interfaces have surprising merging
  behaviour
- **`!` non-null assertions** — narrow explicitly instead
- **Triple-slash references** — use standard ES imports
- **`any`** — use `unknown` and narrow, or fix the upstream type

## Import conventions

Two rules enforced by the `ricochet-imports` lint plugin
(`plugins/lint-imports.ts`):

1. **Hash alias** (`use-hash-alias`) — cross-folder project imports must use
   `#/` (e.g. `#/game/types.ts`). Same-folder imports (`./board.ts`) are the
   only allowed relative form.

2. **Import order** (`import-order`) — exactly two groups, sorted
   alphabetically within each, separated by one blank line:
   ```ts
   import clsx from "clsx/lite";       // group 1: third-party (bare, npm:, jsr:)
   import { page } from "fresh";

   import { define } from "#/core.ts"; // group 2: project (#/ and ./)
   ```

Both grouping and sort order are fixed by `deno lint --fix`.

## Comments

- `//` for short inline notes on non-obvious logic
- Multi-line block for documentation on exported functions and types:
  ```ts
  /**
   * Returns the minimum number of moves to reach the destination,
   * or throws SolverDepthExceededError if the board is too complex.
   */
  ```
- Never use `/** single line */` — either `//` or a proper multi-line block
