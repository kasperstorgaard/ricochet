const ONE_DAY_MS = 1000 * 60 * 60 * 24;

/**
 * Gets the day of the year (1-365/366) for a given date
 */
export function getDayOfYear(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - firstDayOfYear.getTime()) / ONE_DAY_MS);
}

/**
 * Picks an item from a list based on the day of the year.
 * Uses modulo cycling to deterministically select items.
 *
 * Note: Adding or removing items will change which item is selected
 *
 * @example
 * // Day 32 with 10 items -> index 1
 * // Day 32 with 11 items -> index 9
 * // Day 33 with 10 items -> index 2
 */
export function pickByDay<TItem>(
  items: TItem[],
  date: Date = new Date(Date.now()),
) {
  if (items.length === 0) return null;

  const dayOfYear = getDayOfYear(date);
  return items[(dayOfYear - 1) % items.length];
}
