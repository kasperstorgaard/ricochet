import { assertEquals, assertThrows } from "jsr:@std/assert";
import { parsePuzzle, ParserError } from "./parser.ts";
import { BoardError } from "#/util/board.ts";

Deno.test("parsePuzzle - parses simple puzzle", () => {
  const markdown = `---
name: Simple Puzzle
slug: simple-puzzle
---

A simple starting puzzle.

+ A B C D E F G H +
1                 |
2   @             |
3                 |
4                 |
5         #       |
6                 |
7                 |
8       ~         |
+-----------------+
`;

  const result = parsePuzzle(markdown);

  assertEquals(result.metadata, {
    name: "Simple Puzzle",
    slug: "simple-puzzle",
  });

  assertEquals(result.description, "A simple starting puzzle.");

  assertEquals(result.board.destination, { x: 3, y: 7 });

  assertEquals(result.board.pieces, [
    { x: 1, y: 1, type: "rook" },
    { x: 4, y: 4, type: "bouncer" },
  ]);
});

Deno.test("parsePuzzle - parses puzzle without description", () => {
  const markdown = `---
name: No Description
---

+ A B C D E F G H +
1 @               |
2                 |
3                 |
4                 |
5                 |
6                 |
7                 |
8       ~         |
+-----------------+
`;

  const result = parsePuzzle(markdown);

  assertEquals(result.metadata.name, "No Description");
  assertEquals(result.description, undefined);
  assertEquals(result.board.pieces, [{ x: 0, y: 0, type: "rook" }]);
});

Deno.test("parsePuzzle - parses puzzle with multiple bouncers", () => {
  const markdown = `---
name: Multiple Bouncers
---

+ A B C D E F G H +
1 @               |
2   #             |
3     #           |
4       #         |
5                 |
6                 |
7                 |
8       ~         |
+-----------------+
`;

  const result = parsePuzzle(markdown);

  assertEquals(result.board.pieces.length, 4);
  assertEquals(
    result.board.pieces,
    [
      { type: "rook", x: 0, y: 0 },
      { type: "bouncer", x: 1, y: 1 },
      { type: "bouncer", x: 2, y: 2 },
      { type: "bouncer", x: 3, y: 3 },
    ],
  );
});

Deno.test("parsePuzzle - parses puzzle with walls", () => {
  const markdown = `---
name: Walls Puzzle
---

+ A B C D E F G H +
1 @               |
2                 |
3     _           |
4                 |
5  |              |
6                 |
7                 |
8       ~         |
+-----------------+
`;

  const result = parsePuzzle(markdown);

  assertEquals(result.board.walls.length, 2);
  assertEquals(result.board.walls[0], {
    x: 2,
    y: 2,
    orientation: "horizontal",
  });
  assertEquals(result.board.walls[1], { x: 0, y: 4, orientation: "vertical" });
});

Deno.test("parsePuzzle - parses metadata with extra fields", () => {
  const markdown = `---
name: Advanced Puzzle
slug: advanced-puzzle
difficulty: hard
author: John Doe
tags: challenge
---

+ A B C D E F G H +
1 @               |
2                 |
3                 |
4                 |
5                 |
6                 |
7                 |
8       ~         |
+-----------------+
`;

  const result = parsePuzzle(markdown);

  assertEquals(result.metadata.name, "Advanced Puzzle");
  assertEquals(result.metadata.slug, "advanced-puzzle");
  assertEquals(result.metadata.difficulty, "hard");
  assertEquals(result.metadata.author, "John Doe");
  assertEquals(result.metadata.tags, "challenge");
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
8       ~         |
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
8       ~         |
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
8       ~         |
+-----------------+
`;

  assertThrows(
    () => parsePuzzle(markdown),
    ParserError,
  );
});

Deno.test("parsePuzzle - throws on missing destination", () => {
  const markdown = `---
name: No Destination
---

+ A B C D E F G H +
1 @               |
2                 |
3                 |
4                 |
5                 |
6                 |
7                 |
8                 |
+-----------------+
`;

  assertThrows(() => parsePuzzle(markdown), BoardError);
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
8       ~         |
+-----------------+
`;

  assertThrows(() => parsePuzzle(markdown), ParserError);
});

Deno.test("parsePuzzle - throws on missing rook", () => {
  const markdown = `---
name: No Rook
---

+ A B C D E F G H +
1 #               |
2                 |
3                 |
4                 |
5                 |
6                 |
7                 |
8       ~         |
+-----------------+
`;

  assertThrows(() => parsePuzzle(markdown), BoardError);
});

Deno.test("parsePuzzle - throws on no pieces", () => {
  const markdown = `---
name: No Pieces
---

+ A B C D E F G H +
1                 |
2                 |
3                 |
4                 |
5                 |
6                 |
7                 |
8       ~         |
+-----------------+
`;

  assertThrows(() => parsePuzzle(markdown), BoardError);
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
8       ~         |
+-----------------+
`;

  assertThrows(
    () => parsePuzzle(markdown),
    ParserError,
    "Unknown cell character 'Q'",
  );
});

Deno.test("parsePuzzle - real-world example", () => {
  const markdown = `---
name: Around the middle
slug: around-the-middle
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
7       #̃         |
8    |         |  |
+-----------------+
`;

  const result = parsePuzzle(markdown);

  assertEquals(result.metadata.name, "Around the middle");
  assertEquals(result.metadata.difficulty, "medium");
  assertEquals(result.board.pieces.length, 5);
  assertEquals(
    result.board.pieces.filter((p) => p.type === "bouncer").length,
    4,
  );
  assertEquals(result.board.destination, { x: 3, y: 6 });
});
