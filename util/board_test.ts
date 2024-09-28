import { assertEquals } from "jsr:@std/assert";

import {
  getTargets,
  isPositionAligned,
  isPositionSame,
  Position,
  validateBoard,
} from "./board.ts";
import { assertThrows } from "$std/assert/assert_throws.ts";

Deno.test("isPositionSame() should be true for identical positions", () => {
  assertEquals(
    isPositionSame({ x: 0, y: 0 }, { x: 0, y: 0 }),
    true,
  );
  assertEquals(
    isPositionSame({ x: 6, y: 6 }, { x: 6, y: 6 }),
    true,
  );
});

Deno.test("isPositionSame() should be false for different positions", () => {
  assertEquals(
    isPositionSame({ x: 12, y: 5 }, { x: 5, y: 12 }),
    false,
  );
  assertEquals(
    isPositionSame({ x: 5, y: 12 }, { x: 0, y: 12 }),
    false,
  );
});

Deno.test("isPositionAligned() should be false for positions that are not aligned", () => {
  assertEquals(
    isPositionAligned({ x: 3, y: 5 }, { x: 4, y: 6 }),
    false,
  );
});

Deno.test("isPositionAligned() should be true for x-aligned", () => {
  assertEquals(
    isPositionAligned({ x: 3, y: 5 }, { x: 3, y: 6 }),
    true,
  );
});

Deno.test("isPositionAligned() should be true for y-aligned", () => {
  assertEquals(
    isPositionAligned({ x: 2, y: 7 }, { x: 10, y: 7 }),
    true,
  );
});

Deno.test("getTargets() should get 4 positions for a center source", () => {
  const targets = getTargets({ x: 3, y: 5 }, {
    cols: 7,
    rows: 11,
    walls: [],
    pieces: [],
  });

  assertEquals(
    targets,
    {
      top: { x: 3, y: 0 },
      right: { x: 6, y: 5 },
      bottom: { x: 3, y: 10 },
      left: { x: 0, y: 5 },
    },
  );
});

Deno.test("getTargets() walls should end targets", () => {
  const targets = getTargets({ x: 6, y: 8 }, {
    cols: 7,
    rows: 11,
    walls: [
      { x: 6, y: 4, orientation: "horizontal" },
    ],
    pieces: [],
  });

  assertEquals(
    targets,
    {
      top: { x: 6, y: 4 },
      right: { x: 6, y: 8 },
      bottom: { x: 6, y: 10 },
      left: { x: 0, y: 8 },
    },
  );
});

Deno.test("getTargets() should respect multiple walls", () => {
  const targets = getTargets({ x: 3, y: 4 }, {
    cols: 7,
    rows: 11,
    walls: [
      { x: 3, y: 4, orientation: "horizontal" },
      { x: 6, y: 4, orientation: "horizontal" },
      { x: 5, y: 4, orientation: "vertical" },
      { x: 3, y: 4, orientation: "vertical" },
    ],
    pieces: [],
  });

  assertEquals(targets, {
    top: { x: 3, y: 4 },
    right: { x: 4, y: 4 },
    bottom: { x: 3, y: 10 },
    left: { x: 3, y: 4 },
  });
});

Deno.test("getTargets() should use the closest wall to src", () => {
  const targets = getTargets({ x: 2, y: 8 }, {
    cols: 7,
    rows: 11,
    walls: [
      { x: 2, y: 4, orientation: "horizontal" },
      { x: 2, y: 6, orientation: "horizontal" },
    ],
    pieces: [],
  });

  assertEquals(
    targets,
    {
      top: { x: 2, y: 6 },
      right: { x: 6, y: 8 },
      bottom: { x: 2, y: 10 },
      left: { x: 0, y: 8 },
    },
  );
});

Deno.test("getTargets() is not affected by not non-aligned walls", () => {
  const targets = getTargets({ x: 4, y: 5 }, {
    cols: 7,
    rows: 11,
    walls: [
      { x: 5, y: 6, orientation: "horizontal" },
      { x: 1, y: 3, orientation: "horizontal" },
      { x: 6, y: 6, orientation: "horizontal" },
      { x: 5, y: 2, orientation: "vertical" },
      { x: 1, y: 3, orientation: "vertical" },
      { x: 2, y: 8, orientation: "vertical" },
    ],
    pieces: [],
  });

  assertEquals(
    targets,
    {
      top: { x: 4, y: 0 },
      right: { x: 6, y: 5 },
      bottom: { x: 4, y: 10 },
      left: { x: 0, y: 5 },
    },
  );
});

Deno.test("getTargets() pieces should end targets", () => {
  const targets = getTargets({ x: 6, y: 8 }, {
    cols: 7,
    rows: 11,
    walls: [],
    pieces: [
      { x: 6, y: 4 },
    ],
  });

  assertEquals(
    targets,
    {
      top: { x: 6, y: 5 },
      right: { x: 6, y: 8 },
      bottom: { x: 6, y: 10 },
      left: { x: 0, y: 8 },
    },
  );
});

Deno.test("getTargets() is not affected by non-aligned pieces", () => {
  const targets = getTargets({ x: 6, y: 8 }, {
    cols: 7,
    rows: 11,
    walls: [],
    pieces: [
      { x: 5, y: 6 },
      { x: 1, y: 3 },
      { x: 5, y: 2 },
      { x: 1, y: 3 },
      { x: 2, y: 4 },
    ],
  });

  assertEquals(
    targets,
    {
      top: { x: 6, y: 0 },
      right: { x: 6, y: 8 },
      bottom: { x: 6, y: 10 },
      left: { x: 0, y: 8 },
    },
  );
});

Deno.test("getTargets() should respect both pieces and walls", () => {
  const targets = getTargets({ x: 3, y: 6 }, {
    cols: 7,
    rows: 11,
    walls: [
      { x: 3, y: 7, orientation: "horizontal" },
      { x: 3, y: 4, orientation: "horizontal" },
      { x: 6, y: 6, orientation: "vertical" },
    ],
    pieces: [
      { x: 3, y: 4 },
      { x: 3, y: 2 },
      { x: 0, y: 6 },
    ],
  });

  assertEquals(targets, {
    top: { x: 3, y: 5 },
    right: { x: 5, y: 6 },
    bottom: { x: 3, y: 6 },
    left: { x: 1, y: 6 },
  });
});

Deno.test("validateBoard() should throw with an empty board", () => {
  assertThrows(() => {
    validateBoard({
      cols: 0,
      rows: 0,
      destination: null as unknown as Position,
      pieces: [],
      walls: [],
    });
  });
});

Deno.test("validateBoard() should throw with no cols", () => {
  assertThrows(() => {
    validateBoard({
      cols: 0,
      rows: 7,
      destination: { x: 0, y: 0 },
      pieces: [{ x: 0, y: 4, type: "rook" }],
      walls: [{ x: 1, y: 1, orientation: "horizontal" }],
    });
  });
});

Deno.test("validateBoard() should throw with no rows", () => {
  assertThrows(() => {
    validateBoard({
      cols: 6,
      rows: 0,
      destination: { x: 0, y: 0 },
      pieces: [{ x: 0, y: 4, type: "rook" }],
      walls: [{ x: 1, y: 1, orientation: "horizontal" }],
    });
  });
});

Deno.test("validateBoard() should throw with no pieces", () => {
  assertThrows(() => {
    validateBoard({
      cols: 7,
      rows: 7,
      destination: { x: 0, y: 3 },
      pieces: [],
      walls: [{ x: 1, y: 2, orientation: "horizontal" }],
    });
  });
});

Deno.test("validateBoard() should throw with no rooks", () => {
  assertThrows(() => {
    validateBoard({
      cols: 7,
      rows: 7,
      destination: { x: 0, y: 3 },
      pieces: [{ x: 4, y: 1, type: "bouncer" }],
      walls: [{ x: 1, y: 2, orientation: "horizontal" }],
    });
  });
});

Deno.test("validateBoard() should throw with destination out of bounds", () => {
  assertThrows(() => {
    validateBoard({
      cols: 7,
      rows: 7,
      destination: { x: 0, y: 8 },
      pieces: [{ x: 4, y: 1, type: "rook" }],
      walls: [{ x: 1, y: 2, orientation: "horizontal" }],
    });
  });
});

Deno.test("validateBoard() should throw with piece out of bounds", () => {
  assertThrows(() => {
    validateBoard({
      cols: 7,
      rows: 7,
      destination: { x: 0, y: 3 },
      pieces: [{ x: 12, y: 1, type: "rook" }],
      walls: [{ x: 1, y: 2, orientation: "horizontal" }],
    });
  });
});

Deno.test("validateBoard() should throw with wall out of bounds", () => {
  assertThrows(() => {
    validateBoard({
      cols: 7,
      rows: 7,
      destination: { x: 0, y: 3 },
      pieces: [{ x: 0, y: 1, type: "rook" }],
      walls: [{ x: 1, y: 90, orientation: "horizontal" }],
    });
  });
});

Deno.test("validateBoard() should throw with identical pieces", () => {
  assertThrows(() => {
    validateBoard({
      cols: 6,
      rows: 6,
      destination: { x: 0, y: 3 },
      pieces: [{ x: 4, y: 1, type: "rook" }, { x: 4, y: 1, type: "rook" }],
      walls: [{ x: 1, y: 2, orientation: "horizontal" }],
    });
  });
});

Deno.test("validateBoard() should throw with identical piece positions", () => {
  assertThrows(() => {
    validateBoard({
      cols: 6,
      rows: 6,
      destination: { x: 0, y: 3 },
      pieces: [{ x: 4, y: 1, type: "bouncer" }, { x: 4, y: 1, type: "rook" }],
      walls: [{ x: 1, y: 2, orientation: "horizontal" }],
    });
  });
});

Deno.test("validateBoard() should throw with identical walls", () => {
  assertThrows(() => {
    validateBoard({
      cols: 7,
      rows: 7,
      destination: { x: 0, y: 3 },
      pieces: [{ x: 4, y: 1, type: "rook" }],
      walls: [
        { x: 1, y: 2, orientation: "horizontal" },
        { x: 1, y: 2, orientation: "horizontal" },
      ],
    });
  });
});

Deno.test("validateBoard() should return true for valid simple board", () => {
  const result = validateBoard({
    cols: 7,
    rows: 7,
    destination: { x: 0, y: 3 },
    pieces: [{ x: 4, y: 1, type: "rook" }],
    walls: [{ x: 1, y: 2, orientation: "horizontal" }],
  });

  assertEquals(result, true);
});

Deno.test("validateBoard() should return true for valid complex board", () => {
  const result = validateBoard({
    cols: 7,
    rows: 7,
    destination: { x: 2, y: 3 },
    pieces: [
      { x: 4, y: 1, type: "rook" },
      { x: 2, y: 1, type: "bouncer" },
      { x: 3, y: 2, type: "bouncer" },
      { x: 2, y: 5, type: "bouncer" },
      { x: 3, y: 6, type: "bouncer" },
      { x: 4, y: 4, type: "bouncer" },
    ],
    walls: [
      { x: 1, y: 2, orientation: "horizontal" },
      { x: 1, y: 2, orientation: "vertical" },
      { x: 4, y: 3, orientation: "horizontal" },
      { x: 0, y: 6, orientation: "horizontal" },
      { x: 5, y: 1, orientation: "vertical" },
      { x: 1, y: 6, orientation: "horizontal" },
    ],
  });

  assertEquals(result, true);
});
