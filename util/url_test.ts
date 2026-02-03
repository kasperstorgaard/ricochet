import { assertEquals } from "@std/assert";

import {
  decodeState,
  encodeState,
  getActiveHref,
  getMoveHref,
  getRedoHref,
  getResetHref,
  getUndoHref,
} from "#/util/url.ts";

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

Deno.test("getMoveHref() should append move and update cursor", () => {
  const result = getMoveHref(
    [{ x: 0, y: 0 }, { x: 0, y: 5 }],
    {
      href: "http://example.com",
      moves: [],
      cursor: 0,
    },
  );

  assertEquals(result, "http://example.com/?m=A1A6&a=A6&c=1");
});

Deno.test("getMoveHref() should truncate moves at cursor position", () => {
  const result = getMoveHref(
    [{ x: 2, y: 2 }, { x: 2, y: 7 }],
    {
      href: "http://example.com",
      moves: [
        [{ x: 0, y: 0 }, { x: 0, y: 5 }],
        [{ x: 0, y: 5 }, { x: 5, y: 5 }],
      ],
      cursor: 1,
    },
  );

  assertEquals(result, "http://example.com/?m=A1A6-C3C8&a=C8&c=2");
});

Deno.test("getActiveHref() should set active position", () => {
  const result = getActiveHref(
    { x: 3, y: 4 },
    {
      href: "http://example.com",
      moves: [[{ x: 0, y: 0 }, { x: 0, y: 5 }]],
      cursor: 1,
    },
  );

  assertEquals(result, "http://example.com/?m=A1A6&a=D5&c=1");
});

Deno.test("getUndoHref() should decrement cursor", () => {
  const result = getUndoHref("http://example.com", {
    moves: [
      [{ x: 0, y: 0 }, { x: 0, y: 5 }],
      [{ x: 0, y: 5 }, { x: 5, y: 5 }],
    ],
    cursor: 2,
  });

  assertEquals(result, "http://example.com/?m=A1A6-F6&c=1");
});

Deno.test("getUndoHref() should not go below zero", () => {
  const result = getUndoHref("http://example.com", {
    moves: [[{ x: 0, y: 0 }, { x: 0, y: 5 }]],
    cursor: 0,
  });

  assertEquals(result, "http://example.com/?m=A1A6&c=0");
});

Deno.test("getRedoHref() should increment cursor", () => {
  const result = getRedoHref("http://example.com", {
    moves: [
      [{ x: 0, y: 0 }, { x: 0, y: 5 }],
      [{ x: 0, y: 5 }, { x: 5, y: 5 }],
    ],
    cursor: 0,
  });

  assertEquals(result, "http://example.com/?m=A1A6-F6&c=1");
});

Deno.test("getRedoHref() should not exceed moves length", () => {
  const result = getRedoHref("http://example.com", {
    moves: [[{ x: 0, y: 0 }, { x: 0, y: 5 }]],
    cursor: 1,
  });

  assertEquals(result, "http://example.com/?m=A1A6&c=1");
});

Deno.test("getResetHref() should remove all game params", () => {
  const result = getResetHref("http://example.com/?m=A1A6&a=F1&c=1&other=kept");

  assertEquals(result, "http://example.com/?other=kept");
});
