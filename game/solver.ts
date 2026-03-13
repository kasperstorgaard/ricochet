import { COLS, ROWS } from "#/game/board.ts";
import type { Board, Move, Puzzle } from "#/game/types.ts";

/**
 * Default solver limits.
 */
const DEFAULT_MAX_DEPTH = 15;

/**
 * BFS state limit — hard cap to prevent OOM on pathological boards.
 * At ~80 bytes per entry, 10M states ≈ 800 MB worst case.
 * Medium puzzles stay well under 100K; hard puzzles (7+ pieces) may need
 * several million.
 */
const BFS_STATE_LIMIT = 10_000_000;

/**
 * Solver configuration options.
 */
type SolverOptions = {
  // Maximum search depth in moves (default: 15)
  maxDepth?: number;
};

// Error thrown when the solver exceeds the maximum search depth or state limit
export class SolverDepthExceededError extends Error {
  constructor(depth: number) {
    super(`Solver depth ${depth} exceeded`);
    this.name = "SolverDepthExceededError";
  }
}

export type SolverProgress = { depth: number };
export type SolverEvent =
  | { type: "progress" } & SolverProgress
  | { type: "solution"; moves: Move[] }
  | { type: "error"; message: string };

type WallLookup = {
  /** hWalls[x] = y-values of horizontal walls that block vertical movement in column x */
  hWalls: number[][];
  /** vWalls[y] = x-values of vertical walls that block horizontal movement in row y */
  vWalls: number[][];
};

type Config = {
  pieceCount: number;
} & WallLookup;

/**
 * Open-addressing hash set backed by Float64Array.
 * ~6x less memory than Set<number> — keys are stored inline at 8 bytes each
 * instead of as heap objects. Better cache locality on lookups too.
 *
 * Uses -1 as the empty sentinel; all valid state keys are ≥ 0.
 * Load factor is capped at 50% to keep average probe length near 1.5.
 */
class CompactSet {
  private data: Float64Array;
  private mask: number;
  size = 0;

  constructor(initialCapacity = 1024) {
    let cap = 1;
    while (cap < initialCapacity) cap <<= 1;
    this.data = new Float64Array(cap).fill(-1);
    this.mask = cap - 1;
  }

  has(key: number): boolean {
    let i = this.hash(key);
    while (this.data[i] !== -1) {
      if (this.data[i] === key) return true;
      i = (i + 1) & this.mask;
    }
    return false;
  }

  add(key: number): void {
    if (this.size > (this.mask >> 1)) this.grow();
    let i = this.hash(key);
    while (this.data[i] !== -1) {
      if (this.data[i] === key) return;
      i = (i + 1) & this.mask;
    }
    this.data[i] = key;
    this.size++;
  }

  private hash(key: number): number {
    // Mix hi/lo 32-bit halves for keys > 2^32, then Fibonacci scatter
    const lo = key >>> 0;
    const hi = (key / 0x100000000) | 0;
    return (Math.imul(lo ^ hi, 0x9e3779b9) >>> 0) & this.mask;
  }

  private grow(): void {
    const old = this.data;
    const newCap = (this.mask + 1) << 1;
    this.data = new Float64Array(newCap).fill(-1);
    this.mask = newCap - 1;
    this.size = 0;
    for (let i = 0; i < old.length; i++) {
      if (old[i] !== -1) this.add(old[i]);
    }
  }
}

function reconstructPath(
  metadata: {
    parentIndexes: Int32Array;
    fromPositions: Uint8Array;
    toPositions: Uint8Array;
  },
  goalIdx: number,
): Move[] {
  const path: Array<[number, number]> = [];
  let idx = goalIdx;

  while (metadata.parentIndexes[idx] !== -1) {
    path.push([metadata.fromPositions[idx], metadata.toPositions[idx]]);
    idx = metadata.parentIndexes[idx];
  }

  path.reverse();

  return path.map(([from, to]) => [
    { x: from % COLS, y: (from / COLS) | 0 },
    { x: to % COLS, y: (to / COLS) | 0 },
  ]);
}

/**
 * BFS solver — visits each unique state exactly once, guarantees optimal solution.
 *
 * Uses flat typed arrays for the BFS queue (statePool + parallel metadata arrays)
 * to eliminate heap object allocation per state. Path is reconstructed via parent
 * pointers rather than storing full histories.
 *
 * Throws SolverDepthExceededError if the state count exceeds BFS_STATE_LIMIT
 * (very deep or wall-sparse boards) or if maxDepth is reached without solution.
 */
function bfsSolve(board: Board, maxDepth: number): Move[] {
  const destPos = board.destination.y * COLS + board.destination.x;
  const initialState = initState(board);

  if (initialState[0] === destPos) return [];

  const config: Config = {
    ...buildWallLookup(board.walls),
    pieceCount: initialState.length,
  };

  // State pool: all states packed flat — no heap object per state
  const statePool = new Uint8Array(BFS_STATE_LIMIT * config.pieceCount);
  statePool.set(initialState, 0);

  // Parallel arrays for entry metadata
  const metadata = {
    parentIndexes: new Int32Array(BFS_STATE_LIMIT).fill(-1),
    fromPositions: new Uint8Array(BFS_STATE_LIMIT),
    toPositions: new Uint8Array(BFS_STATE_LIMIT),
    depths: new Uint8Array(BFS_STATE_LIMIT), // max depth 15 fits in u8
  };

  // Pre-allocated moves buffer: 4 directions × n pieces × 2 values

  const visited = new CompactSet();
  const stateKey = stateKeyAt(statePool, 0, config);
  visited.add(stateKey);

  let entryCount = 1;
  let front = 0;
  let hitMaxDepth = false;

  while (front < entryCount) {
    if (entryCount >= BFS_STATE_LIMIT) {
      throw new SolverDepthExceededError(maxDepth);
    }

    const frontOffset = front * config.pieceCount;
    const depth = metadata.depths[front];
    const parentIdx = front;
    front++;

    if (depth >= maxDepth) {
      hitMaxDepth = true;
      continue;
    }

    const moves = getMoves(
      statePool,
      frontOffset,
      config,
    );

    // loop over moves (increment by 2 bc. moves have 2 positions)
    for (let idx = 0; idx < moves.count; idx += 2) {
      const move: [number, number] = [moves.buffer[idx], moves.buffer[idx + 1]];

      // Write next state directly into statePool at entryCount offset
      const target = entryCount * config.pieceCount;

      const copyRange: [number, number] = [
        frontOffset,
        frontOffset + config.pieceCount,
      ];

      applyMoveInto(
        statePool,
        target,
        copyRange,
        config,
        move,
      );

      const stateKey = stateKeyAt(statePool, target, config);

      if (visited.has(stateKey)) continue;
      visited.add(stateKey);

      metadata.parentIndexes[entryCount] = parentIdx;
      metadata.fromPositions[entryCount] = move[0];
      metadata.toPositions[entryCount] = move[1];
      metadata.depths[entryCount] = depth + 1;

      if (statePool[target] === destPos) {
        return reconstructPath(metadata, entryCount);
      }

      entryCount++;
    }
  }

  if (hitMaxDepth) throw new SolverDepthExceededError(maxDepth);
  throw new Error("Unsolvable puzzle");
}

/**
 * Solves a board using BFS, yielding a progress event then the solution.
 *
 * BFS visits each unique board state once — no repeated passes like IDA*.
 * Compact state representation (Uint8Array + numeric key) and parent-pointer
 * path reconstruction keep memory well under the BFS_STATE_LIMIT for typical
 * medium-difficulty puzzles.
 *
 * Throws SolverDepthExceededError when no solution is found within maxDepth
 * or when the state count exceeds BFS_STATE_LIMIT.
 */
export function* solve(
  puzzleOrBoard: Board | Puzzle,
  options: SolverOptions = {},
): Generator<SolverEvent> {
  const board = "board" in puzzleOrBoard ? puzzleOrBoard.board : puzzleOrBoard;
  const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;

  yield { type: "progress", depth: 1 };

  const moves = bfsSolve(board, maxDepth);
  yield { type: "solution", moves };
}

/**
 * Solves a puzzle synchronously using BFS to find the minimum move solution.
 */
export function solveSync(
  puzzleOrBoard: Puzzle | Board,
  options: SolverOptions = {},
): Move[] {
  const board = "board" in puzzleOrBoard ? puzzleOrBoard.board : puzzleOrBoard;

  for (const event of solve(board, options)) {
    if (event.type === "solution") return event.moves;
  }

  throw new Error("Unsolvable puzzle");
}

/**
 * Copies state from pool[srcOff..srcOff+n] into pool[dstOff..dstOff+n],
 * replacing fromPos with toPos.
 * Maintains canonical order: puck at index 0, blockers sorted ascending.
 * Uses insertion sort on the single changed element — O(n) worst case.
 */
// TODO: refactor these args, it's crazy
function applyMoveInto(
  pool: Uint8Array,
  target: number,
  copyRange: [number, number],
  config: Config,
  move: [number, number],
): void {
  pool.copyWithin(target, ...copyRange);

  if (pool[target] === move[0]) {
    pool[target] = move[1];
    return;
  }

  for (let pieceIdx = 1; pieceIdx < config.pieceCount; pieceIdx++) {
    if (pool[target + pieceIdx] === move[0]) {
      pool[target + pieceIdx] = move[1];

      let current = pieceIdx;

      // Sort the pieces
      // TODO: what is going on in this case?
      while (
        current > 1 && pool[target + current] < pool[target + current - 1]
      ) {
        const tmp = pool[target + current];
        pool[target + current] = pool[target + current - 1];
        pool[target + current - 1] = tmp;
        current--;
      }

      // TODO: what is going on in this case?
      while (
        current < config.pieceCount - 1 &&
        pool[target + current] > pool[target + current + 1]
      ) {
        const tmp = pool[target + current];
        pool[target + current] = pool[target + current + 1];
        pool[target + current + 1] = tmp;
        current++;
      }

      return;
    }
  }
}

/**
 * Writes flat move pairs [from0, to0, from1, to1, …] into buf for all valid moves.
 * Returns a move buffer and the number of values written (always even).
 *
 * Wall constraints narrow the axis-aligned range; piece constraints narrow it further.
 * Target occupancy is checked last to avoid emitting blocked squares.
 */
function getMoves(
  pool: Uint8Array,
  offset: number,
  config: Config,
) {
  let count = 0;
  const buffer = new Uint8Array(config.pieceCount * 8);

  for (let piece = 0; piece < config.pieceCount; piece++) {
    const piecePos = pool[offset + piece];
    const pieceX = piecePos % COLS;
    const pieceY = (piecePos / COLS) | 0;

    // Target min/max positions along the outer bounds of the grid
    let up = 0, down = ROWS - 1, left = 0, right = COLS - 1;

    // Check all vertical walls, and stop when hit
    for (const wallY of config.hWalls[pieceX]) {
      if (wallY <= pieceY && wallY > up) up = wallY;
      if (wallY > pieceY && wallY - 1 < down) down = wallY - 1;
    }

    // Check all horizontal walls, and stop when hit
    for (const wallX of config.vWalls[pieceY]) {
      if (wallX <= pieceX && wallX > left) left = wallX;
      if (wallX > pieceX && wallX - 1 < right) right = wallX - 1;
    }

    // Check against all other pieces
    for (let otherPiece = 0; otherPiece < config.pieceCount; otherPiece++) {
      if (otherPiece === piece) continue;

      const otherPos = pool[offset + otherPiece];
      const otherX = otherPos % COLS;
      const otherY = (otherPos / COLS) | 0;

      if (otherY === pieceY) {
        if (otherX < pieceX && otherX >= left) left = otherX + 1;
        if (otherX > pieceX && otherX <= right) right = otherX - 1;
      } else if (otherX === pieceX) {
        if (otherY < pieceY && otherY >= up) up = otherY + 1;
        if (otherY > pieceY && otherY <= down) down = otherY - 1;
      }
    }

    // Emit one move per direction where the piece actually slides somewhere new.
    if (up !== pieceY) {
      buffer[count++] = piecePos;
      buffer[count++] = up * COLS + pieceX;
    }

    if (down !== pieceY) {
      buffer[count++] = piecePos;
      buffer[count++] = down * COLS + pieceX;
    }
    if (left !== pieceX) {
      buffer[count++] = piecePos;
      buffer[count++] = pieceY * COLS + left;
    }
    if (right !== pieceX) {
      buffer[count++] = piecePos;
      buffer[count++] = pieceY * COLS + right;
    }
  }

  return {
    buffer,
    count,
  };
}

function buildWallLookup(walls: Board["walls"]): WallLookup {
  const hWalls: number[][] = Array.from({ length: COLS }, () => []);
  const vWalls: number[][] = Array.from({ length: ROWS }, () => []);

  for (const wall of walls) {
    if (wall.orientation === "horizontal") hWalls[wall.x].push(wall.y);
    else vWalls[wall.y].push(wall.x);
  }

  return { hWalls, vWalls };
}

function initState(board: Board): Uint8Array {
  const puck = board.pieces.find((p) => p.type === "puck")!;
  const blockers = board.pieces
    .filter((piece) => piece.type === "blocker")
    .map((piece) => piece.y * COLS + piece.x)
    .sort((a, b) => a - b);
  return new Uint8Array([puck.y * COLS + puck.x, ...blockers]);
}

// Packed integer key — safe for up to 8 pieces (64^8 < Number.MAX_SAFE_INTEGER).
function stateKeyAt(pool: Uint8Array, offset: number, config: Config): number {
  let key = 0;

  for (let pieceIdx = 0; pieceIdx < config.pieceCount; pieceIdx++) {
    key = key * 64 + pool[offset + pieceIdx];
  }

  return key;
}
