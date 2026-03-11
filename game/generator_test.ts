import { assertExists } from "@std/assert/exists";

import { generate } from "./generator.ts";

Deno.test("generate() produces a valid board", () => {
  const result = generate({
    solveRange: [4, 4],
    wallsRange: [5, 10],
    blockersRange: [4, 10],
    wallSpread: "balanced",
  });

  assertExists(result.board);
});
