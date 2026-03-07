import { assertEquals } from "@std/assert";

import { getSolutionPercentile } from "#/game/stats.ts";
import { PuzzleStats } from "#/game/types.ts";

const baseStats: PuzzleStats = {
  totalSolutions: 10,
  solutionsHistogram: { 3: 2, 4: 5, 5: 3 },
  uniqueSolvers: 8,
  hintUsageCount: 2,
};

// getSolutionPercentile

Deno.test("getSolutionPercentile - most solutions have higher move count", () => {
  // 3 moves: 8 solutions used 4 or 5 moves → 80%
  assertEquals(getSolutionPercentile(baseStats, 3), 80);
});

Deno.test("getSolutionPercentile - some solutions have higher move count", () => {
  // 4 moves: 3 solutions used 5 moves → 30%
  assertEquals(getSolutionPercentile(baseStats, 4), 30);
});

Deno.test("getSolutionPercentile - no solutions have higher move count", () => {
  // 5 moves: nothing higher → 0%
  assertEquals(getSolutionPercentile(baseStats, 5), 0);
});

Deno.test("getSolutionPercentile - move count below all recorded solutions", () => {
  // 2 moves: all 10 solutions used more → 100%
  assertEquals(getSolutionPercentile(baseStats, 2), 100);
});

Deno.test("getSolutionPercentile - no solutions returns 0", () => {
  const empty: PuzzleStats = {
    totalSolutions: 0,
    solutionsHistogram: {},
    uniqueSolvers: 0,
    hintUsageCount: 0,
  };
  assertEquals(getSolutionPercentile(empty, 3), 0);
});
