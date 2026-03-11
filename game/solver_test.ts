import { assertEquals, assertObjectMatch, assertThrows } from "@std/assert";
import { assertExists } from "@std/assert/exists";

import { isValidSolution, resolveMoves } from "./board.ts";
import { bfsGen, solve, SolverDepthExceededError } from "./solver.ts";
import type { Board, Puzzle } from "#/game/types.ts";

Deno.test("solve() finds 1-move solution (puck slides to destination)", () => {
  // Puck at A1 (0,0) slides right to H1 (7,0) where destination is
  const board: Board = {
    destination: { x: 7, y: 0 },
    pieces: [{ x: 0, y: 0, type: "puck" }],
    walls: [],
  };

  const result = solve(board);

  assertEquals(result, [[{ x: 0, y: 0 }, { x: 7, y: 0 }]]);
});

Deno.test("solve() finds 2-move solution", () => {
  // Puck at A1, needs to go to H8
  // Move 1: A1 -> A8 (down)
  // Move 2: A8 -> H8 (right)
  const board: Board = {
    destination: { x: 7, y: 7 },
    pieces: [{ x: 0, y: 0, type: "puck" }],
    walls: [],
  };

  const result = solve(board);
  assertEquals(result?.length, 2);
});

Deno.test("solve() throws for unsolvable puzzle (puck trapped)", () => {
  // Puck at A1 trapped by walls, cannot reach H8
  const board: Board = {
    destination: { x: 7, y: 7 },
    pieces: [{ x: 0, y: 0, type: "puck" }],
    walls: [
      { x: 1, y: 0, orientation: "vertical" },
      { x: 0, y: 1, orientation: "horizontal" },
    ],
  };

  assertThrows(() => solve(board));
});

Deno.test("solve() throws for unsolvable puzzle (puck can't stop)", () => {
  const board: Board = {
    destination: { x: 5, y: 5 },
    pieces: [
      { x: 1, y: 1, type: "puck" },
    ],
    walls: [],
  };

  assertThrows(() => solve(board));
});

Deno.test("solve() respects maxDepth option", () => {
  // Puzzle that requires at least 2 moves
  const board: Board = {
    destination: { x: 7, y: 7 },
    pieces: [{ x: 0, y: 0, type: "puck" }],
    walls: [],
  };

  // With maxDepth 1, it should not find the 2-move solution
  assertThrows(() => solve(board, { maxDepth: 1 }), SolverDepthExceededError);
});

Deno.test("solve() accepts Puzzle type (not just Board)", () => {
  const puzzle: Puzzle = {
    number: 5,
    slug: "test",
    name: "Test",
    createdAt: new Date(),
    difficulty: "medium",
    minMoves: 7,
    board: {
      destination: { x: 7, y: 0 },
      pieces: [{ x: 0, y: 0, type: "puck" as const }],
      walls: [],
    },
  };

  const result = solve(puzzle);

  assertEquals(result?.length, 1);
});

Deno.test("bfsGen() yields progress then solution", () => {
  // Puck at (0,0), dest at (7,7) — not aligned, initial threshold = 2
  const board: Board = {
    destination: { x: 7, y: 7 },
    pieces: [{ x: 0, y: 0, type: "puck" }],
    walls: [],
  };

  let lastProgress: { depth: number };
  let solution: unknown;

  for (const event of bfsGen(board, {})) {
    if (event.type === "progress") lastProgress = event;
    if (event.type === "solution") solution = event.moves;
  }

  // IDA* reports threshold as depth; initial threshold is 2 (h for unaligned puck)
  assertObjectMatch(lastProgress!, { depth: 2 });
  assertExists(solution);
});

Deno.test("solve() solves complex puzzle", () => {
  const board: Board = {
    "destination": { "x": 4, "y": 5 },
    "pieces": [
      { "x": 1, "y": 1, "type": "blocker" },
      { "x": 6, "y": 1, "type": "puck" },
      { "x": 1, "y": 6, "type": "blocker" },
      { "x": 6, "y": 6, "type": "blocker" },
    ],
    "walls": [
      { "x": 2, "y": 2, "orientation": "horizontal" },
      { "x": 3, "y": 2, "orientation": "horizontal" },
      { "x": 4, "y": 2, "orientation": "horizontal" },
      { "x": 5, "y": 2, "orientation": "horizontal" },
      { "x": 2, "y": 2, "orientation": "vertical" },
      { "x": 6, "y": 2, "orientation": "vertical" },
      { "x": 6, "y": 3, "orientation": "vertical" },
      { "x": 6, "y": 4, "orientation": "vertical" },
      { "x": 2, "y": 5, "orientation": "vertical" },
      { "x": 2, "y": 6, "orientation": "horizontal" },
      { "x": 3, "y": 6, "orientation": "horizontal" },
      { "x": 4, "y": 6, "orientation": "horizontal" },
      { "x": 6, "y": 5, "orientation": "vertical" },
      { "x": 5, "y": 6, "orientation": "horizontal" },
    ],
  };

  const result = solve(board);

  // Solution is optimal and valid (IDA* may find a different path of equal length)
  assertEquals(result.length, 10);
  assertEquals(isValidSolution(resolveMoves(board, result)), true);
});

Deno.test("solve() solves complex puzzle with many pieces", () => {
  const board: Board = {
    destination: { x: 3, y: 6 },
    pieces: [
      { x: 2, y: 1, type: "blocker" },
      { x: 5, y: 2, type: "puck" },
      { x: 7, y: 3, type: "blocker" },
      { x: 0, y: 4, type: "blocker" },
      { x: 3, y: 6, type: "blocker" },
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
  };

  const result = solve(board);

  // Solution is optimal and valid (IDA* may find a different path of equal length)
  assertEquals(result.length, 9);
  assertEquals(isValidSolution(resolveMoves(board, result)), true);
});
