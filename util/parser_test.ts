import { assertEquals, assertObjectMatch, assertThrows } from "@std/assert";

import { parsePuzzle, ParserError } from "./parser.ts";

Deno.test("parsePuzzle - parses metadata with extra fields", () => {
  const markdown = `---
name: Advanced Puzzle
slug: advanced-puzzle
difficulty: hard
author: John Doe
createdAt: 2025-06-15T00:00:00.000Z
---

+ A B C D E F G H +
1 @               |
2                 |
3                 |
4                 |
5                 |
6                 |
7                 |
8       X         |
+-----------------+
`;

  const result = parsePuzzle(markdown);

  assertObjectMatch(result, {
    name: "Advanced Puzzle",
    slug: "advanced-puzzle",
    author: "John Doe",
    board: {},
    createdAt: new Date("2025-06-15T00:00:00.000Z"),
  });
});

Deno.test("parsePuzzle - throws on missing frontmatter", () => {
  const markdown = `
+ A B C D E F G H +
1 @               |
2                 |
3                 |
4                 |
5                 |
6                 |
7                 |
8       X         |
+-----------------+
`;

  assertThrows(() => parsePuzzle(markdown), TypeError);
});

Deno.test("parsePuzzle - throws on missing name in metadata", () => {
  const markdown = `---
slug: no-name
---

+ A B C D E F G H +
1 @               |
2                 |
3                 |
4                 |
5                 |
6                 |
7                 |
8       X         |
+-----------------+
`;

  assertThrows(
    () => parsePuzzle(markdown),
    ParserError,
    "must include 'name' field",
  );
});

Deno.test("parsePuzzle - throws on missing board grid", () => {
  const markdown = `---
name: No Grid
---

This puzzle has no grid.
`;

  assertThrows(
    () => parsePuzzle(markdown),
    ParserError,
  );
});

Deno.test("parsePuzzle - throws on wrong number of rows", () => {
  const markdown = `---
name: Wrong Rows
---

+ A B C D E F G H +
1 @               |
2                 |
8       X         |
+-----------------+
`;

  assertThrows(
    () => parsePuzzle(markdown),
    ParserError,
  );
});

Deno.test("parsePuzzle - throws on multiple destinations", () => {
  const markdown = `---
name: Multiple Destinations
---

+ A B C D E F G H +
1 @               |
2   X             |
3                 |
4                 |
5                 |
6                 |
7                 |
8       X         |
+-----------------+
`;

  assertThrows(() => parsePuzzle(markdown), ParserError);
});

Deno.test("parsePuzzle - throws on unknown cell character", () => {
  const markdown = `---
name: Unknown Character
---

+ A B C D E F G H +
1 @               |
2   Q             |
3                 |
4                 |
5                 |
6                 |
7                 |
8       X         |
+-----------------+
`;

  assertThrows(
    () => parsePuzzle(markdown),
    ParserError,
    "Unknown cell character 'Q'",
  );
});

Deno.test("parsePuzzle - parses simple puzzle", () => {
  const markdown = `---
name: Simple Puzzle
slug: simple-puzzle
description: A simple starting puzzle.
createdAt: 2026-01-01T00:00:00.000Z
---

+ A B C D E F G H +
1                 |
2   @             |
3                 |
4                 |
5         #       |
6                 |
7                 |
8       X         |
+-----------------+
`;

  const result = parsePuzzle(markdown);

  assertEquals(result, {
    name: "Simple Puzzle",
    slug: "simple-puzzle",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    description: "A simple starting puzzle.",
    board: {
      destination: { x: 3, y: 7 },
      pieces: [
        { x: 1, y: 1, type: "rook" },
        { x: 4, y: 4, type: "bouncer" },
      ],
      walls: [],
    },
  });
});

Deno.test("parsePuzzle - real-world example 1", () => {
  const markdown = `---
name: Around the middle
slug: around-the-middle
createdAt: 2025-06-15T00:00:00.000Z
difficulty: medium
author: Puzzle Master
---

Navigate the rook around the middle

+ A B C D E F G H +
1  |         |    |
2 _   #         _ |
3     _ _ _ @̲     |
4    |       |  # |
5 #  |_ _ _ _|    |
6 _             _ |
7       #̂         |
8    |         |  |
+-----------------+
`;

  const result = parsePuzzle(markdown);

  console.log(JSON.stringify(result, null, 2));

  assertObjectMatch(result, {
    name: "Around the middle",
    slug: "around-the-middle",
    author: "Puzzle Master",
  });

  assertEquals(result.board, {
    destination: { x: 3, y: 6 },
    pieces: [
      { x: 2, y: 1, type: "bouncer" },
      { x: 5, y: 2, type: "rook" },
      { x: 7, y: 3, type: "bouncer" },
      { x: 0, y: 4, type: "bouncer" },
      { x: 3, y: 6, type: "bouncer" },
    ],
    walls: [
      { x: 1, y: 0, orientation: "vertical" },
      { x: 6, y: 0, orientation: "vertical" },
      { x: 0, y: 2, orientation: "horizontal" },
      { x: 7, y: 2, orientation: "horizontal" },
      { x: 2, y: 3, orientation: "horizontal" },
      { x: 3, y: 3, orientation: "horizontal" },
      { x: 4, y: 3, orientation: "horizontal" },
      { x: 5, y: 3, orientation: "horizontal" },
      { x: 2, y: 3, orientation: "vertical" },
      { x: 6, y: 3, orientation: "vertical" },
      { x: 2, y: 4, orientation: "vertical" },
      { x: 2, y: 5, orientation: "horizontal" },
      { x: 3, y: 5, orientation: "horizontal" },
      { x: 4, y: 5, orientation: "horizontal" },
      { x: 6, y: 4, orientation: "vertical" },
      { x: 5, y: 5, orientation: "horizontal" },
      { x: 0, y: 6, orientation: "horizontal" },
      { x: 7, y: 6, orientation: "horizontal" },
      { x: 2, y: 7, orientation: "vertical" },
      { x: 7, y: 7, orientation: "vertical" },
    ],
  });
});

Deno.test("parsePuzzle - real-world example 2", () => {
  const markdown = `---
name: Boxy
slug: boxy
createdAt: 2026-01-01T00:00:00.000Z
---

+ A B C D E F G H +
1                 |
2   # _ _ _ _ @   |
3    |       |    |
4            |    |
5            |    |
6    |_ _ X̲ _|    |
7   #         #   |
8                 |
+-----------------+
`;

  const result = parsePuzzle(markdown);

  assertObjectMatch(result, {
    name: "Boxy",
    slug: "boxy",
  });

  assertEquals(result.board, {
    destination: { x: 4, y: 5 },
    pieces: [
      { x: 1, y: 1, type: "bouncer" },
      { x: 6, y: 1, type: "rook" },
      { x: 1, y: 6, type: "bouncer" },
      { x: 6, y: 6, type: "bouncer" },
    ],
    walls: [
      { x: 2, y: 2, orientation: "horizontal" },
      { x: 3, y: 2, orientation: "horizontal" },
      { x: 4, y: 2, orientation: "horizontal" },
      { x: 5, y: 2, orientation: "horizontal" },
      { x: 2, y: 2, orientation: "vertical" },
      { x: 6, y: 2, orientation: "vertical" },
      { x: 6, y: 3, orientation: "vertical" },
      { x: 6, y: 4, orientation: "vertical" },
      { x: 2, y: 5, orientation: "vertical" },
      { x: 2, y: 6, orientation: "horizontal" },
      { x: 3, y: 6, orientation: "horizontal" },
      { x: 4, y: 6, orientation: "horizontal" },
      { x: 6, y: 5, orientation: "vertical" },
      { x: 5, y: 6, orientation: "horizontal" },
    ],
  });
});

Deno.test("parsePuzzle - real-world example 3", () => {
  const markdown = `---
name: Joe
slug: joe
createdAt: 2026-02-03T00:00:00.000Z
---

+ A B C D E F G H +
1         #̂       |
2     _ _ _ _ _   |
3            |    |
4            |    |
5    |    @  |    |
6    |_ _  ̲ _|    |
7                 |
8     #       #   |
+-----------------+
`;

  const result = parsePuzzle(markdown);

  assertObjectMatch(result, {
    name: "Joe",
    slug: "joe",
  });

  assertEquals(result.board, {
    destination: { x: 4, y: 0 },
    pieces: [
      { x: 4, y: 0, type: "bouncer" },
      { x: 4, y: 4, type: "rook" },
      { x: 2, y: 7, type: "bouncer" },
      { x: 6, y: 7, type: "bouncer" },
    ],
    walls: [
      { x: 2, y: 2, orientation: "horizontal" },
      { x: 3, y: 2, orientation: "horizontal" },
      { x: 4, y: 2, orientation: "horizontal" },
      { x: 5, y: 2, orientation: "horizontal" },
      { x: 6, y: 2, orientation: "horizontal" },

      { x: 6, y: 2, orientation: "vertical" },
      { x: 6, y: 3, orientation: "vertical" },
      { x: 2, y: 4, orientation: "vertical" },
      { x: 6, y: 4, orientation: "vertical" },
      { x: 2, y: 5, orientation: "vertical" },
      { x: 2, y: 6, orientation: "horizontal" },
      { x: 3, y: 6, orientation: "horizontal" },
      { x: 4, y: 6, orientation: "horizontal" },
      { x: 6, y: 5, orientation: "vertical" },
      { x: 5, y: 6, orientation: "horizontal" },
    ],
  });
});
