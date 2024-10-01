import { parseBoard, stringifyBoard } from "./url.ts";
import { assertThrows } from "$std/assert/assert_throws.ts";
import { assertEquals } from "$std/assert/assert_equals.ts";
import { BoardState } from "./board.ts";

Deno.test("stringifyBoard() should stringify a simple board", () => {
  const result = decodeURIComponent(stringifyBoard({
    destination: { x: 3, y: 4 },
    pieces: [{ x: 2, y: 5, type: "rook" }],
    walls: [],
  }));

  assertEquals(result, "d=3_4&p=r2_5");
});

Deno.test("stingifyBoard() should stringify a complex board", () => {
  const board: BoardState = {
    destination: { x: 2, y: 9 },
    pieces: [
      { type: "rook", x: 1, y: 5 },
      { type: "bouncer", x: 2, y: 8 },
      { type: "bouncer", x: 5, y: 0 },
      { type: "bouncer", x: 4, y: 5 },
      { type: "rook", x: 2, y: 6 },
      { type: "rook", x: 0, y: 7 },
      { type: "rook", x: 3, y: 4 },
    ],
    walls: [
      { x: 0, y: 0, orientation: "horizontal" },
      { x: 0, y: 6, orientation: "vertical" },
      { x: 3, y: 4, orientation: "vertical" },
      { x: 4, y: 9, orientation: "horizontal" },
      { x: 0, y: 3, orientation: "vertical" },
      { x: 6, y: 5, orientation: "horizontal" },
      { x: 4, y: 2, orientation: "horizontal" },
    ],
  };

  const result = decodeURIComponent(stringifyBoard(board));

  assertEquals(
    result,
    [
      "d=2_9&p=r1_5+b2_8+b5_0+b4_5+r2_6+r0_7+r3_4",
      "&w=h0_0+v0_6+v3_4+h4_9+v0_3+h6_5+h4_2",
    ].join(""),
  );
});

Deno.test("parseBoard() should throw if invalid", () => {
  assertThrows(() => parseBoard("p=r1_9&d=nn"));
});

Deno.test("parseBoard() returns a simple board", () => {
  const result = parseBoard("d=3_4&p=r1_5");

  assertEquals(result, {
    destination: { x: 3, y: 4 },
    pieces: [{ type: "rook", x: 1, y: 5 }],
    walls: [],
  });
});

Deno.test("parseBoard() returns a complex board", () => {
  const result = parseBoard("d=0_2&p=r1_5%2Bb2_7%2Br5_7&w=h2_2%2Bv4_5");

  assertEquals(result, {
    destination: { x: 0, y: 2 },
    pieces: [
      { type: "rook", x: 1, y: 5 },
      { type: "bouncer", x: 2, y: 7 },
      { type: "rook", x: 5, y: 7 },
    ],
    walls: [
      { x: 2, y: 2, orientation: "horizontal" },
      { x: 4, y: 5, orientation: "vertical" },
    ],
  });
});

Deno.test("parseBoard() should parse a simple board", () => {
  const board: BoardState = {
    destination: { x: 3, y: 4 },
    pieces: [{ type: "rook", x: 1, y: 5 }],
    walls: [],
  };

  const stringified = stringifyBoard(board);
  const result = parseBoard(stringified);

  assertEquals(result, board);
});

Deno.test("stringifyBoard() should stringify a parsed board", () => {
  const params = "d=3_4&p=r1_5";
  const board = parseBoard(params);
  const result = decodeURIComponent(stringifyBoard(board));

  assertEquals(result, params);
});
