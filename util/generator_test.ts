import { assertEquals } from "@std/assert";
import { generate } from "./generator.ts";

Deno.test("generate() produces a valid, solvable board", () => {
  const result = generate({
    solveRange: [4, 4],
    wallsRange: [5, 10],
    bouncersRange: [4, 10],
    wallSpread: "balanced",
  });

  assertEquals(result.moves.length, 4);
});
