import { PuzzleStats } from "#/game/types.ts";

export const defaultPuzzleStats: PuzzleStats = {
  totalSolutions: 0,
  solutionsHistogram: {},
  uniqueSolvers: 0,
  hintUsageCount: 0,
};

/**
 * Returns the percentile rank of moveCount among recorded solutions (0–100).
 * e.g. 80 means this solution used fewer moves than 80% of recorded solutions.
 */
export function getSolutionPercentile(
  stats: PuzzleStats,
  moveCount: number,
): number {
  if (stats.totalSolutions === 0) return 0;

  const higherCount = Object.entries(stats.solutionsHistogram)
    .filter(([count]) => Number(count) > moveCount)
    .reduce((sum, [, freq]) => sum + freq, 0);

  return Math.round((higherCount / stats.totalSolutions) * 100);
}
