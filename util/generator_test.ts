import { assertEquals } from "@std/assert";
import { generate } from "./generator.ts";

Deno.test("generate() produces a valid, solvable board", () => {
  const result = generate({
    solveRange: { min: 4, max: 4 },
    wallsRange: { min: 2, max: 4 },
    bouncersRange: { min: 1, max: 2 },
    wallSpread: "balanced",
  });

  assertEquals(result.moves.length, 4);
});
