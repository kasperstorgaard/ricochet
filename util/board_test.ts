import { assertEquals } from "jsr:@std/assert";

import {
  BoardError,
  getTargets,
  isPositionAligned,
  isPositionSame,
  isValidMove,
  isValidSolution,
  resolveMoves,
  validateBoard,
} from "./board.ts";
import { assertThrows } from "$std/assert/assert_throws.ts";
import { Piece, Position } from "../db/types.ts";

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
    isPositionSame({ x: 7, y: 5 }, { x: 5, y: 7 }),
    false,
  );
  assertEquals(
    isPositionSame({ x: 5, y: 7 }, { x: 0, y: 7 }),
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
    isPositionAligned({ x: 2, y: 7 }, { x: 5, y: 7 }),
    true,
  );
});

Deno.test("getTargets() should return {} for an empty space", () => {
  const result = getTargets({ x: 4, y: 4 }, {
    walls: [],
    pieces: [],
  });

  assertEquals(result, {});
});

Deno.test("getTargets() should get 4 positions for a center source", () => {
  const targets = getTargets({ x: 3, y: 5 }, {
    walls: [],
    pieces: [{ type: "rook", x: 3, y: 5 }],
  });

  assertEquals(
    targets,
    {
      up: { x: 3, y: 0 },
      right: { x: 7, y: 5 },
      down: { x: 3, y: 7 },
      left: { x: 0, y: 5 },
    },
  );
});

Deno.test("getTargets() should ignore itself", () => {
  const targets = getTargets({ x: 3, y: 5 }, {
    walls: [],
    pieces: [{ x: 3, y: 5, type: "rook" }],
  });

  assertEquals(
    targets,
    {
      up: { x: 3, y: 0 },
      right: { x: 7, y: 5 },
      down: { x: 3, y: 7 },
      left: { x: 0, y: 5 },
    },
  );
});

Deno.test("getTargets() walls should end targets", () => {
  const targets = getTargets({ x: 6, y: 6 }, {
    walls: [
      { x: 6, y: 4, orientation: "horizontal" },
    ],
    pieces: [{ x: 6, y: 6, type: "rook" }],
  });

  assertEquals(
    targets,
    {
      up: { x: 6, y: 4 },
      right: { x: 7, y: 6 },
      down: { x: 6, y: 7 },
      left: { x: 0, y: 6 },
    },
  );
});

Deno.test("getTargets() should respect multiple walls", () => {
  const targets = getTargets({ x: 3, y: 4 }, {
    walls: [
      { x: 3, y: 4, orientation: "horizontal" },
      { x: 6, y: 4, orientation: "horizontal" },
      { x: 5, y: 4, orientation: "vertical" },
      { x: 3, y: 4, orientation: "vertical" },
    ],
    pieces: [{ x: 3, y: 4, type: "rook" }],
  });

  assertEquals(targets, {
    right: { x: 4, y: 4 },
    down: { x: 3, y: 7 },
  });
});

Deno.test("getTargets() should use the closest wall to src", () => {
  const targets = getTargets({ x: 2, y: 7 }, {
    walls: [
      { x: 2, y: 4, orientation: "horizontal" },
      { x: 2, y: 6, orientation: "horizontal" },
    ],
    pieces: [{ x: 2, y: 7, type: "rook" }],
  });

  assertEquals(
    targets,
    {
      up: { x: 2, y: 6 },
      right: { x: 7, y: 7 },
      left: { x: 0, y: 7 },
    },
  );
});

Deno.test("getTargets() is not affected by not non-aligned walls", () => {
  const targets = getTargets({ x: 4, y: 5 }, {
    walls: [
      { x: 5, y: 6, orientation: "horizontal" },
      { x: 1, y: 3, orientation: "horizontal" },
      { x: 6, y: 6, orientation: "horizontal" },
      { x: 5, y: 2, orientation: "vertical" },
      { x: 1, y: 3, orientation: "vertical" },
      { x: 2, y: 6, orientation: "vertical" },
    ],
    pieces: [{ x: 4, y: 5, type: "rook" }],
  });

  assertEquals(
    targets,
    {
      up: { x: 4, y: 0 },
      right: { x: 7, y: 5 },
      down: { x: 4, y: 7 },
      left: { x: 0, y: 5 },
    },
  );
});

Deno.test("getTargets() pieces should end targets", () => {
  const targets = getTargets({ x: 6, y: 6 }, {
    walls: [],
    pieces: [
      { x: 6, y: 4, type: "rook" },
      { x: 6, y: 6, type: "bouncer" },
    ],
  });

  assertEquals(
    targets,
    {
      up: { x: 6, y: 5 },
      right: { x: 7, y: 6 },
      down: { x: 6, y: 7 },
      left: { x: 0, y: 6 },
    },
  );
});

Deno.test("getTargets() is not affected by non-aligned pieces", () => {
  const targets = getTargets({ x: 6, y: 6 }, {
    walls: [],
    pieces: [
      { x: 6, y: 6, type: "rook" },
      { x: 5, y: 4, type: "bouncer" },
      { x: 1, y: 3, type: "bouncer" },
      { x: 5, y: 2, type: "bouncer" },
      { x: 1, y: 3, type: "bouncer" },
      { x: 2, y: 4, type: "bouncer" },
    ],
  });

  assertEquals(
    targets,
    {
      up: { x: 6, y: 0 },
      right: { x: 7, y: 6 },
      down: { x: 6, y: 7 },
      left: { x: 0, y: 6 },
    },
  );
});

Deno.test("getTargets() should respect both pieces and walls", () => {
  const targets = getTargets({ x: 3, y: 6 }, {
    walls: [
      { x: 3, y: 7, orientation: "horizontal" },
      { x: 3, y: 4, orientation: "horizontal" },
      { x: 6, y: 6, orientation: "vertical" },
    ],
    pieces: [
      { x: 3, y: 6, type: "rook" },
      { x: 3, y: 4, type: "bouncer" },
      { x: 3, y: 2, type: "bouncer" },
      { x: 0, y: 6, type: "bouncer" },
    ],
  });

  assertEquals(targets, {
    up: { x: 3, y: 5 },
    right: { x: 5, y: 6 },
    left: { x: 1, y: 6 },
  });
});

Deno.test("getTargets() should not overlap with pieces a)", () => {
  const targets = getTargets({ x: 3, y: 4 }, {
    pieces: [
      { x: 3, y: 4, type: "rook" },
    ],
    walls: [
      { x: 3, y: 4, orientation: "vertical" },
      { x: 3, y: 4, orientation: "horizontal" },
    ],
  });

  assertEquals(
    targets,
    {
      right: { x: 7, y: 4 },
      down: { x: 3, y: 7 },
    },
  );
});

Deno.test("getTargets() should not overlap with pieces b)", () => {
  const targets = getTargets({ x: 6, y: 7 }, {
    pieces: [
      { x: 6, y: 7, type: "rook" },
      { x: 7, y: 7, type: "bouncer" },
    ],
    walls: [],
  });

  assertEquals(
    targets,
    {
      up: { x: 6, y: 0 },
      left: { x: 0, y: 7 },
    },
  );
});

Deno.test("validateBoard() should throw with an empty board", () => {
  assertThrows(() => {
    validateBoard({
      destination: null as unknown as Position,
      pieces: [],
      walls: [],
    });
  }, BoardError);
});

Deno.test("validateBoard() should throw with no pieces", () => {
  assertThrows(() => {
    validateBoard({
      destination: { x: 0, y: 3 },
      pieces: [],
      walls: [{ x: 1, y: 2, orientation: "horizontal" }],
    });
  }, BoardError);
});

Deno.test("validateBoard() should throw with invalid pieces", () => {
  assertThrows(() => {
    validateBoard({
      destination: { x: 0, y: 3 },
      pieces: [{ x: 2, y: 4 } as unknown as Piece],
      walls: [{ x: 1, y: 2, orientation: "horizontal" }],
    });
  }, BoardError);
});

Deno.test("validateBoard() should throw with no rooks", () => {
  assertThrows(() => {
    validateBoard({
      destination: { x: 0, y: 3 },
      pieces: [{ x: 4, y: 1, type: "bouncer" }],
      walls: [{ x: 1, y: 2, orientation: "horizontal" }],
    });
  }, BoardError);
});

Deno.test("validateBoard() should throw with destination out of bounds", () => {
  assertThrows(() => {
    validateBoard({
      destination: { x: 0, y: 8 },
      pieces: [{ x: 4, y: 1, type: "rook" }],
      walls: [{ x: 1, y: 2, orientation: "horizontal" }],
    });
  }, BoardError);
});

Deno.test("validateBoard() should throw with piece out of bounds", () => {
  assertThrows(() => {
    validateBoard({
      destination: { x: 0, y: 3 },
      pieces: [{ x: 12, y: 1, type: "rook" }],
      walls: [{ x: 1, y: 2, orientation: "horizontal" }],
    });
  }, BoardError);
});

Deno.test("validateBoard() should throw with wall out of bounds", () => {
  assertThrows(() => {
    validateBoard({
      destination: { x: 0, y: 3 },
      pieces: [{ x: 0, y: 1, type: "rook" }],
      walls: [{ x: 1, y: 90, orientation: "horizontal" }],
    });
  }, BoardError);
});

Deno.test("validateBoard() should throw with identical pieces", () => {
  assertThrows(() => {
    validateBoard({
      destination: { x: 0, y: 3 },
      pieces: [{ x: 4, y: 1, type: "rook" }, { x: 4, y: 1, type: "rook" }],
      walls: [{ x: 1, y: 2, orientation: "horizontal" }],
    });
  }, BoardError);
});

Deno.test("validateBoard() should throw with identical piece positions", () => {
  assertThrows(() => {
    validateBoard({
      destination: { x: 0, y: 3 },
      pieces: [{ x: 4, y: 1, type: "bouncer" }, { x: 4, y: 1, type: "rook" }],
      walls: [{ x: 1, y: 2, orientation: "horizontal" }],
    });
  }, BoardError);
});

Deno.test("validateBoard() should throw with identical walls", () => {
  assertThrows(() => {
    validateBoard({
      destination: { x: 0, y: 3 },
      pieces: [{ x: 4, y: 1, type: "rook" }],
      walls: [
        { x: 1, y: 2, orientation: "horizontal" },
        { x: 1, y: 2, orientation: "horizontal" },
      ],
    });
  }, BoardError);
});

Deno.test("validateBoard() should return board for valid simple board", () => {
  const result = validateBoard({
    destination: { x: 0, y: 3 },
    pieces: [{ x: 4, y: 1, type: "rook" }],
    walls: [{ x: 1, y: 2, orientation: "horizontal" }],
  });

  assertEquals(result, {
    destination: { x: 0, y: 3 },
    pieces: [{ x: 4, y: 1, type: "rook" }],
    walls: [{ x: 1, y: 2, orientation: "horizontal" }],
  });
});

Deno.test("validateBoard() should return board for valid complex board", () => {
  const result = validateBoard({
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

  assertEquals(result, {
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
});

Deno.test("isValidMove() should return false for move not matching a piece", () => {
  const result = isValidMove([
    { x: 3, y: 1 },
    { x: 6, y: 3 },
  ], {
    pieces: [
      { x: 4, y: 1, type: "rook" },
    ],
    walls: [],
  });

  assertEquals(result, false);
});

Deno.test("isValidMove() should return false for diagonal move", () => {
  const result = isValidMove([
    { x: 4, y: 1 },
    { x: 6, y: 3 },
  ], {
    pieces: [
      { x: 4, y: 1, type: "rook" },
    ],
    walls: [],
  });

  assertEquals(result, false);
});

Deno.test("isValidMove() should return false for blocked move", () => {
  const result = isValidMove([
    { x: 4, y: 1 },
    { x: 6, y: 1 },
  ], {
    pieces: [{ x: 4, y: 1, type: "rook" }],
    walls: [{ x: 5, y: 1, orientation: "vertical" }],
  });

  assertEquals(result, false);
});

Deno.test("resolveMoves() should return the intial board with an empty list", () => {
  const result = resolveMoves({
    pieces: [{ x: 4, y: 1, type: "rook" }],
    walls: [{ x: 5, y: 1, orientation: "vertical" }],
  }, []);

  assertEquals(result, {
    pieces: [{ x: 4, y: 1, type: "rook" }],
    walls: [{ x: 5, y: 1, orientation: "vertical" }],
  });
});

Deno.test("resolveMoves() should return updated board state when passed a single move", () => {
  const result = resolveMoves({
    pieces: [{ x: 4, y: 1, type: "rook" }],
    walls: [{ x: 5, y: 1, orientation: "vertical" }],
  }, [[{ x: 4, y: 1 }, { x: 4, y: 7 }]]);

  assertEquals(result, {
    pieces: [{ x: 4, y: 7, type: "rook" }],
    walls: [{ x: 5, y: 1, orientation: "vertical" }],
  });
});

Deno.test("resolveMoves() should throw if passed an illegal move (a)", () => {
  assertThrows(() =>
    resolveMoves({
      pieces: [{ x: 4, y: 1, type: "rook" }],
      walls: [{ x: 4, y: 4, orientation: "horizontal" }],
    }, [[{ x: 4, y: 1 }, { x: 4, y: 7 }]])
  );
});

Deno.test("resolveMoves() should throw if passed an illegal move (b)", () => {
  assertThrows(() =>
    resolveMoves({
      pieces: [{ x: 4, y: 1, type: "rook" }],
      walls: [],
    }, [
      [{ x: 4, y: 1 }, { x: 4, y: 7 }],
      [{ x: 4, y: 1 }, { x: 5, y: 5 }],
    ])
  );
});

Deno.test("resolveMoves() should return updated board state when passed a list of moves", () => {
  const result = resolveMoves({
    pieces: [
      { x: 4, y: 1, type: "rook" },
      { x: 6, y: 6, type: "bouncer" },
    ],
    walls: [{ x: 5, y: 4, orientation: "horizontal" }],
  }, [
    [{ x: 6, y: 6 }, { x: 6, y: 0 }],
    [{ x: 4, y: 1 }, { x: 4, y: 0 }],
    [{ x: 4, y: 0 }, { x: 5, y: 0 }],
    [{ x: 5, y: 0 }, { x: 5, y: 3 }],
  ]);

  assertEquals(result, {
    pieces: [
      { x: 5, y: 3, type: "rook" },
      { x: 6, y: 0, type: "bouncer" },
    ],
    walls: [{ x: 5, y: 4, orientation: "horizontal" }],
  });
});

Deno.test("isValidSolution() should return false for non matching position", () => {
  const result = isValidSolution(
    {
      destination: { x: 0, y: 2 },
      pieces: [{ x: 4, y: 1, type: "rook" }],
    },
  );

  assertEquals(result, false);
});

Deno.test("isValidSolution() should return false for bouncer", () => {
  const result = isValidSolution(
    {
      destination: { x: 0, y: 2 },
      pieces: [{ type: "bouncer", x: 0, y: 2 }],
    },
  );

  assertEquals(result, false);
});

Deno.test("isValidSolution() should return true for winning position", () => {
  const result = isValidSolution(
    {
      destination: { x: 0, y: 2 },
      pieces: [{ type: "rook", x: 0, y: 2 }],
    },
  );

  assertEquals(result, true);
});
