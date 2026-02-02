import { assertEquals } from "@std/assert";
import { decodeState, encodeState } from "#/util/url.ts";

Deno.test("encodeState() should add all params", () => {
  const result = encodeState({
    moves: [[{ x: 0, y: 0 }, { x: 0, y: 5 }]],
    active: { x: 5, y: 0 },
    cursor: 3,
  });

  assertEquals(result, "m=A1A6&a=F1&c=3");
});

Deno.test("decodeState() should extract all params", () => {
  const url = new URL("http://example.com");
  url.search = "?m=F6F3&a=H8&c=0";
  const result = decodeState(url);

  assertEquals(result, {
    moves: [
      [{ x: 5, y: 5 }, { x: 5, y: 2 }],
    ],
    active: { x: 7, y: 7 },
    cursor: 0,
  });
});
