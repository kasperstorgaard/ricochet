import { assertEquals, assertObjectMatch } from "jsr:@std/assert";
import { formatPuzzle } from "./formatter.ts";
import { parsePuzzle } from "./parser.ts";
import type { Puzzle } from "#/db/types.ts";

Deno.test("formatPuzzle - formats simple puzzle", () => {
  const puzzle: Puzzle = {
    name: "Simple Puzzle",
    slug: "simple-puzzle",
    board: {
      destination: { x: 3, y: 7 },
      pieces: [
        { x: 1, y: 1, type: "rook" },
        { x: 4, y: 4, type: "bouncer" },
      ],
      walls: [],
    },
    description: "A simple starting puzzle.",
  };

  const result = formatPuzzle(puzzle);

  // Parse it back to verify round-trip
  const parsed = parsePuzzle(result);
  assertEquals(parsed, puzzle);
});

Deno.test("formatPuzzle - formats puzzle with walls", () => {
  const puzzle: Puzzle = {
    name: "Walls Puzzle",
    slug: "walls-puzzle",
    board: {
      destination: { x: 7, y: 7 },
      pieces: [{ x: 0, y: 0, type: "rook" }],
      walls: [
        { x: 2, y: 2, orientation: "horizontal" },
        { x: 5, y: 5, orientation: "vertical" },
      ],
    },
  };

  const result = formatPuzzle(puzzle);

  // Verify it contains wall markers
  const parsed = parsePuzzle(result);
  assertEquals(parsed.board.walls.length, 2);
});

Deno.test("formatPuzzle - formats puzzle with piece on destination", () => {
  const puzzle: Puzzle = {
    name: "Piece on Destination",
    slug: "piece-on-destination",
    board: {
      destination: { x: 4, y: 4 },
      pieces: [
        { x: 4, y: 4, type: "rook" }, // Rook on destination
        { x: 2, y: 2, type: "bouncer" },
      ],
      walls: [],
    },
  };

  const result = formatPuzzle(puzzle);

  // Parse it back to verify round-trip
  const parsed = parsePuzzle(result);
  assertEquals(parsed.board.destination, puzzle.board.destination);
  assertEquals(parsed.board.pieces.length, 2);

  // Verify the destination matches the rook position
  const rookOnDest = parsed.board.pieces.find((p) =>
    p.x === 4 && p.y === 4 && p.type === "rook"
  );
  assertEquals(rookOnDest !== undefined, true);
});

Deno.test("formatPuzzle - formats puzzle with piece on destination and wall", () => {
  const puzzle: Puzzle = {
    name: "Complex Piece",
    slug: "complex-piece",
    board: {
      destination: { x: 3, y: 2 },
      pieces: [
        { x: 0, y: 0, type: "rook" }, // Need a rook for validation
        { x: 3, y: 2, type: "bouncer" }, // Bouncer on destination with wall below
      ],
      walls: [
        { x: 3, y: 3, orientation: "horizontal" }, // Wall below the piece (stored at y+1)
      ],
    },
  };

  const result = formatPuzzle(puzzle);

  // Parse it back to verify round-trip
  const parsed = parsePuzzle(result);
  assertEquals(parsed.board.destination, puzzle.board.destination);
  assertEquals(parsed.board.pieces.length, 2);
  assertEquals(parsed.board.walls.length, 1);

  // Verify the destination matches the bouncer position
  const bouncerOnDest = parsed.board.pieces.find((p) =>
    p.x === 3 && p.y === 2 && p.type === "bouncer"
  );
  assertEquals(bouncerOnDest !== undefined, true);
});
