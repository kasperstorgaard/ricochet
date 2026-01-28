import { assertEquals } from "jsr:@std/assert";
import { formatPuzzle } from "./formatter.ts";
import { type ParsedPuzzle, parsePuzzle } from "./parser.ts";

Deno.test("formatPuzzle - formats simple puzzle", () => {
  const puzzle: ParsedPuzzle = {
    metadata: {
      name: "Simple Puzzle",
      slug: "simple-puzzle",
    },
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
  assertEquals(parsed.metadata.name, puzzle.metadata.name);
  assertEquals(parsed.board.destination, puzzle.board.destination);
  assertEquals(parsed.board.pieces.length, puzzle.board.pieces.length);
});

Deno.test("formatPuzzle - formats puzzle with walls", () => {
  const puzzle: ParsedPuzzle = {
    metadata: {
      name: "Walls Puzzle",
    },
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
