import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { getDestinations, isPositionAligned, isPositionSame } from "./board.ts";

Deno.test("isPositionSame() should be true for identical positions", () => {
  assertEquals(
    isPositionSame({ x: 0, y: 0 }, { x: 0, y: 0 }),
    true,
  );
  assertEquals(
    isPositionSame({ x: 6, y: 6 }, { x: 6, y: 6 }),
    true,
  );
});

Deno.test("isPositionSame() should be false for different positions", () => {
  assertEquals(
    isPositionSame({ x: 12, y: 5 }, { x: 5, y: 12 }),
    false,
  );
  assertEquals(
    isPositionSame({ x: 5, y: 12 }, { x: 0, y: 12 }),
    false,
  );
});

Deno.test("isPositionAligned() should be false for positions that are not aligned", () => {
  assertEquals(
    isPositionAligned({ x: 3, y: 5 }, { x: 4, y: 6 }),
    false,
  );
});

Deno.test("isPositionAligned() should be true for x-aligned", () => {
  assertEquals(
    isPositionAligned({ x: 3, y: 5 }, { x: 3, y: 6 }),
    true,
  );
});

Deno.test("isPositionAligned() should be true for y-aligned", () => {
  assertEquals(
    isPositionAligned({ x: 2, y: 7 }, { x: 10, y: 7 }),
    true,
  );
});

Deno.test("getDestinations() should get 4 positions for a center source", () => {
  const destinations = getDestinations({ x: 3, y: 5 }, {
    cols: 7,
    rows: 11,
    walls: [],
  });

  assertEquals(
    destinations,
    {
      top: { x: 3, y: 0 },
      right: { x: 6, y: 5 },
      bottom: { x: 3, y: 10 },
      left: { x: 0, y: 5 },
    },
  );
});

Deno.test("getDestinations() walls should end destinations", () => {
  const destinations = getDestinations({ x: 6, y: 8 }, {
    cols: 7,
    rows: 11,
    walls: [
      { x: 6, y: 4, orientation: "horizontal" },
    ],
  });

  assertEquals(
    destinations,
    {
      top: { x: 6, y: 4 },
      right: { x: 6, y: 8 },
      bottom: { x: 6, y: 10 },
      left: { x: 0, y: 8 },
    },
  );
});

Deno.test("getDestinations() should respect multiple walls", () => {
  const destinations = getDestinations({ x: 3, y: 4 }, {
    cols: 7,
    rows: 11,
    walls: [
      { x: 3, y: 4, orientation: "horizontal" },
      { x: 6, y: 4, orientation: "horizontal" },
      { x: 5, y: 4, orientation: "vertical" },
      { x: 3, y: 4, orientation: "vertical" },
    ],
  });

  assertEquals(destinations, {
    top: { x: 3, y: 4 },
    right: { x: 4, y: 4 },
    bottom: { x: 3, y: 10 },
    left: { x: 3, y: 4 },
  });
});

Deno.test("getDestinations() should use the closest wall to src", () => {
  const destinations = getDestinations({ x: 2, y: 8 }, {
    cols: 7,
    rows: 11,
    walls: [
      { x: 2, y: 4, orientation: "horizontal" },
      { x: 2, y: 6, orientation: "horizontal" },
    ],
  });

  assertEquals(
    destinations,
    {
      top: { x: 2, y: 6 },
      right: { x: 6, y: 8 },
      bottom: { x: 2, y: 10 },
      left: { x: 0, y: 8 },
    },
  );
});

Deno.test("getDestinations() is not affected by not non-aligned walls", () => {
  const destinations = getDestinations({ x: 4, y: 5 }, {
    cols: 7,
    rows: 11,
    walls: [
      { x: 5, y: 6, orientation: "horizontal" },
      { x: 1, y: 3, orientation: "horizontal" },
      { x: 6, y: 6, orientation: "horizontal" },
      { x: 5, y: 2, orientation: "vertical" },
      { x: 1, y: 3, orientation: "vertical" },
      { x: 2, y: 8, orientation: "vertical" },
    ],
  });

  assertEquals(
    destinations,
    {
      top: { x: 4, y: 0 },
      right: { x: 6, y: 5 },
      bottom: { x: 4, y: 10 },
      left: { x: 0, y: 5 },
    },
  );
});
