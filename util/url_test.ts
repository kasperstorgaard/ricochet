import { stringifyBoard } from "./url.ts";
import { assertThrows } from "$std/assert/assert_throws.ts";
import { Position } from "./board.ts";

Deno.test("stringifyBoard() should throw with no destination", () => {
  assertThrows(() => {
    stringifyBoard({
      cols: 7,
      rows: 7,
      destination: null as unknown as Position,
      pieces: [{ x: 1, y: 1, type: "rook" }],
      walls: [],
    });
  });
});

Deno.test("stringifyBoard() should throw with no rooks", () => {
  assertThrows(() => {
    stringifyBoard({
      cols: 6,
      rows: 6,
      pieces: [{ x: 1, y: 1, type: "rook" }],
      walls: [],
      destination: null as unknown as Position,
    });
  });
});

// Deno.test("stringifyBoard() should stringify a single piece", () => {
//   const result = stringifyBoard({
//     pieces: [],
//     walls: [],
//   });

//   assertEquals(result, "");
// });
