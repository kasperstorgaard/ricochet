import { assertEquals } from "@std/assert";

import { getDayOfYear } from "./date.ts";

Deno.test("getDayOfYear - returns correct day number", () => {
  assertEquals(getDayOfYear(new Date(2024, 0, 1)), 1);
  assertEquals(getDayOfYear(new Date(2024, 0, 31)), 31);
  assertEquals(getDayOfYear(new Date(2024, 1, 1)), 32);
});
