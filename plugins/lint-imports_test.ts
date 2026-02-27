import { assertEquals } from "@std/assert";

import plugin from "./lint-imports.ts";

function getViolations(source: string, rule: string, filename = "test.ts") {
  return Deno.lint
    .runPlugin(plugin, filename, source)
    .filter((d) => d.id === `ricochet-imports/${rule}`)
    .map((d) => d.message);
}

// ---------------------------------------------------------------------------
// use-hash-alias
// ---------------------------------------------------------------------------

Deno.test("use-hash-alias - allows #/ imports", () => {
  const source = `import type { Board } from "#/game/types.ts";`;
  const result = getViolations(source, "use-hash-alias");

  assertEquals(result, []);
});

Deno.test("use-hash-alias - allows third-party imports", () => {
  const source = `import { useCallback } from "preact/hooks";`;
  const result = getViolations(source, "use-hash-alias");

  assertEquals(result, []);
});

Deno.test("use-hash-alias - allows same-folder relative imports", () => {
  const source = `import { board } from "./board.ts";`;
  const result = getViolations(source, "use-hash-alias", "game/board_test.ts");

  assertEquals(result, []);
});

Deno.test("use-hash-alias - reports subfolder relative import", () => {
  const source = `import type { Board } from "./game/types.ts";`;
  const result = getViolations(source, "use-hash-alias");

  assertEquals(result, [
    `Use '#/' alias instead of relative path: "./game/types.ts"`,
  ]);
});

Deno.test("use-hash-alias - reports parent-relative import", () => {
  const source = `import type { Direction } from "../game/types.ts";`;
  const result = getViolations(source, "use-hash-alias", "client/moves.ts");

  assertEquals(result, [
    `Use '#/' alias instead of relative path: "../game/types.ts"`,
  ]);
});

// ---------------------------------------------------------------------------
// import-groups
// ---------------------------------------------------------------------------

Deno.test("import-groups - allows third-party then blank line then project", () => {
  const source = [
    `import { useCallback } from "preact/hooks";`,
    ``,
    `import type { Board } from "#/game/types.ts";`,
  ].join("\n");

  const result = getViolations(source, "import-groups");

  assertEquals(result, []);
});

Deno.test("import-groups - allows only third-party imports", () => {
  const source = [
    `import { RefObject } from "preact";`,
    `import { useCallback } from "preact/hooks";`,
  ].join("\n");
  const result = getViolations(source, "import-groups");

  assertEquals(result, []);
});

Deno.test("import-groups - allows only project imports", () => {
  const source = [
    `import type { Board } from "#/game/board.ts";`,
    `import type { Puzzle } from "#/game/types.ts";`,
  ].join("\n");
  const result = getViolations(source, "import-groups");

  assertEquals(result, []);
});

Deno.test("import-groups - reports missing blank line between groups", () => {
  const source = [
    `import { useCallback } from "preact/hooks";`,
    `import type { Board } from "#/game/types.ts";`,
  ].join("\n");

  const result = getViolations(source, "import-groups");

  assertEquals(result, [
    "Expected one blank line between import groups, found 0",
  ]);
});

Deno.test("import-groups - reports two blank lines between groups", () => {
  const source = [
    `import { useCallback } from "preact/hooks";`,
    ``,
    ``,
    `import type { Board } from "#/game/types.ts";`,
  ].join("\n");
  const result = getViolations(source, "import-groups");

  assertEquals(result, [
    "Expected one blank line between import groups, found 2",
  ]);
});

Deno.test("import-groups - reports blank line within a group", () => {
  const source = [
    `import { RefObject } from "preact";`,
    ``,
    `import { useCallback } from "preact/hooks";`,
  ].join("\n");
  const result = getViolations(source, "import-groups");

  assertEquals(result, ["No blank lines within an import group"]);
});

Deno.test("import-groups - reports project before third-party", () => {
  const source = [
    `import type { Board } from "#/game/types.ts";`,
    `import { useCallback } from "preact/hooks";`,
  ].join("\n");
  const result = getViolations(source, "import-groups");

  assertEquals(result, [
    "Third-party imports must come before project imports",
  ]);
});

// ---------------------------------------------------------------------------
// import-sort
// ---------------------------------------------------------------------------

Deno.test("import-sort - allows sorted third-party imports", () => {
  const source = [
    `import { RefObject } from "preact";`,
    `import { useCallback } from "preact/hooks";`,
  ].join("\n");
  const result = getViolations(source, "import-sort");

  assertEquals(result, []);
});

Deno.test("import-sort - allows sorted project imports", () => {
  const source = [
    `import type { Board } from "#/game/board.ts";`,
    `import type { Puzzle } from "#/game/types.ts";`,
  ].join("\n");
  const result = getViolations(source, "import-sort");

  assertEquals(result, []);
});

Deno.test("import-sort - reports unsorted third-party imports", () => {
  const source = [
    `import { useCallback } from "preact/hooks";`,
    `import { RefObject } from "preact";`,
  ].join("\n");
  const result = getViolations(source, "import-sort");

  assertEquals(result, [
    `Import "preact" should be sorted before "preact/hooks"`,
  ]);
});

Deno.test("import-sort - reports unsorted project imports", () => {
  const source = [
    `import type { Puzzle } from "#/game/types.ts";`,
    `import type { Board } from "#/game/board.ts";`,
  ].join("\n");
  const result = getViolations(source, "import-sort");

  assertEquals(result, [
    `Import "#/game/board.ts" should be sorted before "#/game/types.ts"`,
  ]);
});

// ---------------------------------------------------------------------------
// Integration: planted mistakes in client/moves.ts
// ---------------------------------------------------------------------------

const MOVES_BROKEN = [
  `import { useCallback } from "preact/hooks";`,
  `import type { RefObject } from "preact";`,
  `import type { Direction, Piece, Position } from "../game/types.ts";`,
  `import { useArrowKeys } from "../client/keyboard.ts";`,
  `import { useSwipe } from "../client/touch.ts";`,
].join("\n");

Deno.test("integration - use-hash-alias catches all three broken imports", () => {
  const result = getViolations(
    MOVES_BROKEN,
    "use-hash-alias",
    "client/moves.ts",
  );

  assertEquals(result, [
    `Use '#/' alias instead of relative path: "../game/types.ts"`,
    `Use '#/' alias instead of relative path: "../client/keyboard.ts"`,
    `Use '#/' alias instead of relative path: "../client/touch.ts"`,
  ]);
});

Deno.test("integration - import-groups catches missing blank line", () => {
  const result = getViolations(
    MOVES_BROKEN,
    "import-groups",
    "client/moves.ts",
  );

  assertEquals(result, [
    "Expected one blank line between import groups, found 0",
  ]);
});

Deno.test("integration - import-sort catches both unsorted groups", () => {
  const result = getViolations(MOVES_BROKEN, "import-sort", "client/moves.ts");

  assertEquals(result, [
    `Import "preact" should be sorted before "preact/hooks"`,
    `Import "../client/keyboard.ts" should be sorted before "../game/types.ts"`,
  ]);
});
