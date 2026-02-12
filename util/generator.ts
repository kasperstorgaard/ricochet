import { getGrid, validateBoard } from "#/util/board.ts";
import {
  solve,
  SolverDepthExceededError,
  SolverLimitExceededError,
} from "#/util/solver.ts";
import type { Board, Piece, Wall } from "#/util/types.ts";

const MAX_ATTEMPTS = 500;

/**
 * How walls are distributed across the board.
 */
export type WallSpread = "mid" | "balanced" | "spread";

// Options for puzzle generation.
export type GenerateOptions = {
  solveRange: [number, number];
  wallsRange: [number, number];
  bouncersRange: [number, number];
  wallSpread: WallSpread;
  maxAttempts?: number;
};

/**
 * Quadrant boundaries for zone-based wall placement.
 */
type Zone = { x: [number, number]; y: [number, number] };

const QUADRANTS: Zone[] = [
  { x: [0, 3], y: [0, 3] }, // NW
  { x: [4, 7], y: [0, 3] }, // NE
  { x: [0, 3], y: [4, 7] }, // SW
  { x: [4, 7], y: [4, 7] }, // SE
];

const INNER_ZONE: Zone = { x: [2, 5], y: [2, 5] };

/**
 * Generates a random solvable puzzle within the given constraints.
 * Uses pure random placement with solver verification and retry.
 */
export function generate({
  solveRange,
  wallsRange,
  bouncersRange,
  wallSpread,
  maxAttempts = MAX_ATTEMPTS,
}: GenerateOptions) {
  for (
    let attempt = 0;
    attempt < maxAttempts;
    attempt++
  ) {
    const board = generateBoard({
      solveRange,
      wallsRange,
      bouncersRange,
      wallSpread,
    });

    try {
      validateBoard(board);
    } catch {
      continue;
    }

    try {
      const moves = solve(board, { maxDepth: solveRange[1] });

      if (moves && moves.length >= solveRange[0]) {
        return { board, moves };
      }
    } catch (err) {
      if (
        err instanceof SolverDepthExceededError ||
        err instanceof SolverLimitExceededError
      ) {
        continue;
      }

      throw err;
    }
  }

  throw new Error(
    `Failed to generate a puzzle after ${MAX_ATTEMPTS} attempts`,
  );
}

/**
 * Single attempt at random board generation (no solver verification).
 */
function generateBoard({
  wallsRange,
  bouncersRange,
  wallSpread,
}: GenerateOptions): Board {
  const wallCount = randomInt(wallsRange);
  const bouncerCount = randomInt(bouncersRange);

  const walls = placeWalls(wallCount, wallSpread);

  // Build full grid of available positions for pieces
  const pieceSpots = getGrid().flatMap((row) => row);

  const pieces: Piece[] = [];

  // Place bouncers
  for (let i = 0; i < bouncerCount; i++) {
    pieces.push({ ...takeRandom(pieceSpots), type: "bouncer" });
  }

  // Place rook
  pieces.push({ ...takeRandom(pieceSpots), type: "rook" });

  // Place destination (not on any piece)
  const destination = takeRandom(pieceSpots);

  return { destination, pieces, walls };
}

/**
 * Places walls with spread-constrained random positions.
 */
function placeWalls(count: number, spread: WallSpread): Wall[] {
  const walls: Wall[] = [];

  const zones = getWallZones(count, spread);

  for (const zone of zones) {
    const candidates = getPossibleWallPositions(zone);
    if (candidates.length === 0) continue;

    // Try a few times to avoid duplicates
    for (let retry = 0; retry < 10; retry++) {
      const candidate = randomItem(candidates);

      const isDuplicate = walls.some(
        (w) =>
          w.x === candidate.x && w.y === candidate.y &&
          w.orientation === candidate.orientation,
      );

      if (!isDuplicate) {
        walls.push(candidate);
        break;
      }
    }
  }

  return walls;
}

/**
 * Returns one zone per wall to place, based on spread strategy.
 */
function getWallZones(count: number, spread: WallSpread): Zone[] {
  if (spread === "mid") {
    return Array.from({ length: count }, () => INNER_ZONE);
  }

  if (spread === "spread") {
    // Round-robin across all 4 quadrants
    return Array.from({ length: count }, (_, i) => QUADRANTS[i % 4]);
  }

  // balanced: random quadrant per wall, but ensure ≥2 quadrants used
  const zones: Zone[] = [];
  const usedQuadrants = new Set<number>();

  for (let idx = 0; idx < count; idx++) {
    let quadrantIdx: number;

    // For the first 2 walls, force different quadrants
    if (idx < 2 && usedQuadrants.size < 2) {
      do {
        quadrantIdx = randomInt([0, 3]);
      } while (
        usedQuadrants.has(quadrantIdx) && usedQuadrants.size < QUADRANTS.length
      );
    } else {
      quadrantIdx = randomInt([0, 3]);
    }

    usedQuadrants.add(quadrantIdx);
    zones.push(QUADRANTS[quadrantIdx]);
  }

  return zones;
}

/**
 * Returns all valid wall positions within a zone.
 */
function getPossibleWallPositions(zone: Zone): Wall[] {
  const positions: Wall[] = [];

  for (let x = zone.x[0]; x <= zone.x[1]; x++) {
    for (let y = zone.y[0]; y <= zone.y[1]; y++) {
      // Horizontal walls can't be at y=0 (board edge)
      if (y > 0) {
        positions.push({ x, y, orientation: "horizontal" });
      }
      // Vertical walls can't be at x=0 (board edge)
      if (x > 0) {
        positions.push({ x, y, orientation: "vertical" });
      }
    }
  }

  return positions;
}

/**
 * Picks a random item from the array and removes it in place.
 */
function takeRandom<T>(arr: T[]): T {
  const i = randomInt([0, arr.length - 1]);
  return arr.splice(i, 1)[0];
}

function randomInt(range: [number, number]): number {
  return Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
}

function randomItem<T>(arr: T[]): T {
  return arr[randomInt([0, arr.length - 1])];
}
