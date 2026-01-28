import { assertEquals } from "jsr:@std/assert";
import { assertThrows } from "$std/assert/assert_throws.ts";
import {
  decodeMove,
  decodePosition,
  decodeState,
  encodeCoordinate,
  encodeMove,
  encodePosition,
  encodeState,
} from "#/util/url.ts";

Deno.test("encodeCoordinate() should throw when passed a non-number value", () => {
  assertThrows(() => encodeCoordinate("f" as unknown as number));
});

Deno.test("encodeCoordinate() should throw when passed a negative number", () => {
  assertThrows(() => encodeCoordinate(-5));
});

Deno.test("encodeCoordinate() should throw a number above 15", () => {
  assertThrows(() => encodeCoordinate(16));
});

Deno.test("encodeCoordinate() should encode a value (a)", () => {
  const result = encodeCoordinate(0);
  assertEquals(result, "0");
});

Deno.test("encodeCoordinate() should encode a value (b)", () => {
  const result = encodeCoordinate(10);
  assertEquals(result, "a");
});

Deno.test("encodeCoordinate() should encode a value (c)", () => {
  const result = encodeCoordinate(15);
  assertEquals(result, "f");
});

Deno.test("encodePosition() should encode a position", () => {
  const result = encodePosition({ x: 2, y: 12 });
  assertEquals(result, "2c");
});

Deno.test("decodePosition() should decode a value", () => {
  const result = decodePosition("50");
  assertEquals(result, {
    x: 5,
    y: 0,
  });
});

Deno.test("encodeMove() should encode a move", () => {
  const result = encodeMove([{ x: 5, y: 10 }, { x: 5, y: 3 }]);
  assertEquals(result, "5a53");
});

Deno.test("decodeMove() should decode a move", () => {
  const result = decodeMove("0f44");
  assertEquals(result, [{
    x: 0,
    y: 15,
  }, {
    x: 4,
    y: 4,
  }]);
});

Deno.test("encodeState() should encode the game state", () => {
  const result = encodeState({
    moves: [
      [{ x: 0, y: 0 }, { x: 0, y: 12 }],
      [{ x: 0, y: 12 }, { x: 5, y: 12 }],
      [{ x: 5, y: 12 }, { x: 5, y: 7 }],
      [{ x: 5, y: 7 }, { x: 5, y: 0 }],
    ],
    active: { x: 5, y: 0 },
    cursor: 3,
  });

  assertEquals(result, "m=000c%2C0c5c%2C5c57%2C5750&a=50&c=3");
});

Deno.test("decodeState() should decode the game state", () => {
  const url = new URL("http://example.com");
  url.search = "?m=5c57%2C5750&a=ff&c=0";
  const result = decodeState(url);

  assertEquals(result, {
    moves: [
      [{ x: 5, y: 12 }, { x: 5, y: 7 }],
      [{ x: 5, y: 7 }, { x: 5, y: 0 }],
    ],
    active: { x: 15, y: 15 },
    cursor: 0,
  });
});
