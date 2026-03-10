import type { Position } from "#/game/types.ts";

export type KeyframeStop = {
  id: string;
  from: Position;
  to: Position;
};

function writeKeyframeMove(percentage: number, position: Position) {
  return `${percentage}% { --x: ${position.x}; --y: ${position.y}; }`;
}

/**
 * Builds CSS @keyframes text for a set of replay moves.
 * Each stop maps a piece id to a from→to position transition.
 * Stops are evenly distributed across the animation timeline.
 */
export function buildReplayKeyframes(
  stops: KeyframeStop[],
  totalMoves: number,
): string {
  // wait is roughly half a move duration; increment covers only the actual moves.
  const initialWait = 0.4;
  const increment = 100 / (totalMoves + initialWait);
  const waitOffset = initialWait * increment;

  // Group stops by piece id
  const lookup: Record<string, { idx: number; stop: KeyframeStop }[]> = {};

  for (let idx = 0; idx < stops.length; idx++) {
    const stop = stops[idx];
    if (!lookup[stop.id]) lookup[stop.id] = [{ idx, stop }];
    else lookup[stop.id].push({ idx, stop });
  }

  return Object.entries(lookup)
    .map(([id, pieceStops]) => {
      return [
        `@keyframes replay-${id} {`,
        `  ${writeKeyframeMove(0, pieceStops[0].stop.from)}`,
        ...pieceStops.flatMap(({ idx, stop }) => /*
         * Set a start position just before animating,
         * to make sure the animation happens in single steps,
         * not all the way from the start, then animate to position.
         */
        [
          `  ${writeKeyframeMove(idx * increment + waitOffset, stop.from)}`,
          `  ${writeKeyframeMove((idx + 1) * increment + waitOffset, stop.to)}`,
        ]),
        "}",
      ].join("");
    })
    .join("");
}
