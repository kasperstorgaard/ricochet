import { assertEquals } from "@std/assert";
import { solve } from "./solver.ts";
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

  const result = solve(board);
  assertEquals(result, null);
});

Deno.test("solve() respects maxDepth option", () => {
  // Puzzle that requires at least 2 moves
  const board: Board = {
    destination: { x: 7, y: 7 },
    pieces: [{ x: 0, y: 0, type: "rook" }],
    walls: [],
  };

  // With maxDepth 1, it should not find the 2-move solution
  const result = solve(board, { maxDepth: 1 });
  assertEquals(result, null);
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

  // Check that it finds the shortest possible solution (10 moves)
  const result = solve(board);

  assertEquals(
    encodeMoves(result!),
    "B2B6-A6-G2A2-A5-B7B1-A6B6-B1B5-F5-A5E5-E6",
  );

  // Check that the solution is valid
  const endState = resolveMoves(board, result!);
  assertEquals(isValidSolution(endState), true);
});
