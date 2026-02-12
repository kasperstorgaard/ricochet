import { assertEquals, assertThrows } from "@std/assert";
import {
  getHint,
  solve,
  SolverDepthExceededError,
  SolverLimitExceededError,
} from "./solver.ts";
import { encodeMoves } from "./strings.ts";
import type { Board } from "#/util/types.ts";
import { isValidSolution, resolveMoves } from "./board.ts";

Deno.test("solve() finds 1-move solution (rook slides to destination)", () => {
  // Rook at A1 (0,0) slides right to H1 (7,0) where destination is
  const board: Board = {
    destination: { x: 7, y: 0 },
    pieces: [{ x: 0, y: 0, type: "rook" }],
    walls: [],
  };

  const result = solve(board);

  assertEquals(result, [[{ x: 0, y: 0 }, { x: 7, y: 0 }]]);
});

Deno.test("solve() finds 2-move solution", () => {
  // Rook at A1, needs to go to H8
  // Move 1: A1 -> A8 (down)
  // Move 2: A8 -> H8 (right)
  const board: Board = {
    destination: { x: 7, y: 7 },
    pieces: [{ x: 0, y: 0, type: "rook" }],
    walls: [],
  };

  const result = solve(board);
  assertEquals(result?.length, 2);
});

Deno.test("solve() returns null for unsolvable puzzle (rook trapped)", () => {
  // Rook at A1 trapped by walls, cannot reach H8
  const board: Board = {
    destination: { x: 7, y: 7 },
    pieces: [{ x: 0, y: 0, type: "rook" }],
    walls: [
      { x: 1, y: 0, orientation: "vertical" },
      { x: 0, y: 1, orientation: "horizontal" },
    ],
  };

  assertThrows(() => solve(board));
});

Deno.test("solve() returns null for unsolvable puzzle (rook can't stop)", () => {
  const board: Board = {
    destination: { x: 5, y: 5 },
    pieces: [
      { x: 1, y: 1, type: "rook" },
    ],
    walls: [],
  };

  assertThrows(() => solve(board));
});

Deno.test("solve() respects maxDepth option", () => {
  // Puzzle that requires at least 2 moves
  const board: Board = {
    destination: { x: 7, y: 7 },
    pieces: [{ x: 0, y: 0, type: "rook" }],
    walls: [],
  };

  // With maxDepth 1, it should not find the 2-move solution
  assertThrows(() => solve(board, { maxDepth: 1 }), SolverDepthExceededError);
});

Deno.test("solve() respects maxIterations option", () => {
  // Impossible puzzle
  const board: Board = {
    destination: { x: 5, y: 5 },
    pieces: [
      { x: 0, y: 0, type: "rook" },
    ],
    walls: [],
  };

  // With maxIterations 1, it throw before it finds out there is no solution
  assertThrows(
    () => solve(board, { maxIterations: 1 }),
    SolverLimitExceededError,
  );
});

Deno.test("solve() accepts Puzzle type (not just Board)", () => {
  const puzzle = {
    slug: "test",
    name: "Test",
    createdAt: new Date(),
    board: {
      destination: { x: 7, y: 0 },
      pieces: [{ x: 0, y: 0, type: "rook" as const }],
      walls: [],
    },
  };

  const result = solve(puzzle);

  assertEquals(result?.length, 1);
});

Deno.test("solve() solves complex puzzle", () => {
  const board: Board = {
    "destination": { "x": 4, "y": 5 },
    "pieces": [
      { "x": 1, "y": 1, "type": "bouncer" },
      { "x": 6, "y": 1, "type": "rook" },
      { "x": 1, "y": 6, "type": "bouncer" },
      { "x": 6, "y": 6, "type": "bouncer" },
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

  // Check that it finds one of the shortest solutions
  assertEquals(
    encodeMoves(result!),
    "B2B6-A6-G2A2-A5-B7B1-A6B6-B1B5-F5-A5E5-E6",
  );

  // Check that the solution is valid
  const endState = resolveMoves(board, result!);
  assertEquals(isValidSolution(endState), true);
});

Deno.test("solve() solves complex puzzle with many pieces", () => {
  const board: Board = {
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
  };

  const result = solve(board);

  // Check that it finds one of the shortest solutions
  assertEquals(
    encodeMoves(result!),
    "F3H3-H4H6-A6-H3H6-D7D6-A6C6-D6D8-H6D6-D7",
  );

  // Check that the solution is valid
  const endState = resolveMoves(board, result!);
  assertEquals(isValidSolution(endState), true);
});

Deno.test("getHint() returns first move of the optimal solution", () => {
  const board: Board = {
    destination: { x: 7, y: 0 },
    pieces: [{ x: 0, y: 0, type: "rook" }],
    walls: [],
  };

  const result = getHint(board);

  assertEquals(result, [{ x: 0, y: 0 }, { x: 7, y: 0 }]);
});

Deno.test("getHint() returns null for unsolvable puzzle", () => {
  const board: Board = {
    destination: { x: 7, y: 7 },
    pieces: [{ x: 0, y: 0, type: "rook" }],
    walls: [
      { x: 1, y: 0, orientation: "vertical" },
      { x: 0, y: 1, orientation: "horizontal" },
    ],
  };

  assertThrows(() => getHint(board));
});

Deno.test("getHint() returns first move of a multi-move solution", () => {
  const board: Board = {
    destination: { x: 7, y: 7 },
    pieces: [{ x: 0, y: 0, type: "rook" }],
    walls: [],
  };

  const hint = getHint(board);
  const solution = solve(board);

  assertEquals(hint, solution![0]);
});
