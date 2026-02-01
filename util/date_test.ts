import { assertEquals } from "jsr:@std/assert";
import { getDayOfYear, pickByDay } from "./date.ts";

Deno.test("getDayOfYear - returns correct day number", () => {
  assertEquals(getDayOfYear(new Date(2024, 0, 1)), 1);
  assertEquals(getDayOfYear(new Date(2024, 0, 31)), 31);
  assertEquals(getDayOfYear(new Date(2024, 1, 1)), 32);
});

Deno.test("pickByDay - day 32 with 10 items returns index 1", () => {
  const items = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  const date = new Date(2024, 1, 1);
  const result = pickByDay(items, date);

  assertEquals(result, 1);
});

Deno.test("pickByDay - day 32 with 11 items returns index 9 (rotation changes)", () => {
  const items = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const date = new Date(2024, 1, 1);
  const result = pickByDay(items, date);

  assertEquals(result, 9); // Changes when item count changes
});
