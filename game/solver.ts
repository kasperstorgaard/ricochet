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

type WallIndex = {
  /** hWalls[x] = y-values of horizontal walls that block vertical movement in column x */
  hWalls: number[][];
  /** vWalls[y] = x-values of vertical walls that block horizontal movement in row y */
  vWalls: number[][];
};

function indexWalls(walls: Board["walls"]): WallIndex {
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
    .filter((p) => p.type === "blocker")
    .map((p) => p.y * COLS + p.x)
    .sort((a, b) => a - b);
  return new Uint8Array([puck.y * COLS + puck.x, ...blockers]);
}

// Packed integer key — safe for up to 8 pieces (64^8 < Number.MAX_SAFE_INTEGER).
function stateKeyAt(pool: Uint8Array, offset: number, n: number): number {
  let key = 0;
  for (let i = 0; i < n; i++) key = key * 64 + pool[offset + i];
  return key;
}

/**
 * Copies state from pool[srcOff..srcOff+n] into pool[dstOff..dstOff+n],
 * replacing fromPos with toPos.
 * Maintains canonical order: puck at index 0, blockers sorted ascending.
 * Uses insertion sort on the single changed element — O(n) worst case.
 */
function applyMoveInto(
  pool: Uint8Array,
  srcOff: number,
  n: number,
  fromPos: number,
  toPos: number,
  dstOff: number,
): void {
  pool.copyWithin(dstOff, srcOff, srcOff + n);
  if (pool[dstOff] === fromPos) {
    pool[dstOff] = toPos;
    return;
  }
  for (let i = 1; i < n; i++) {
    if (pool[dstOff + i] === fromPos) {
      pool[dstOff + i] = toPos;
      let j = i;
      while (j > 1 && pool[dstOff + j] < pool[dstOff + j - 1]) {
        const tmp = pool[dstOff + j];
        pool[dstOff + j] = pool[dstOff + j - 1];
        pool[dstOff + j - 1] = tmp;
        j--;
      }
      while (j < n - 1 && pool[dstOff + j] > pool[dstOff + j + 1]) {
        const tmp = pool[dstOff + j];
        pool[dstOff + j] = pool[dstOff + j + 1];
        pool[dstOff + j + 1] = tmp;
        j++;
      }
      return;
    }
  }
}

/**
 * Writes flat move pairs [from0, to0, from1, to1, …] into buf for all valid moves.
 * Returns the number of values written (always even).
 *
 * Wall constraints narrow the axis-aligned range; piece constraints narrow it further.
 * Target occupancy is checked last to avoid emitting blocked squares.
 */
function getMoves(
  pool: Uint8Array,
  offset: number,
  n: number,
  { hWalls, vWalls }: WallIndex,
  buf: Uint8Array,
): number {
  let count = 0;

  for (let pi = 0; pi < n; pi++) {
    const pos = pool[offset + pi];
    const srcX = pos % COLS;
    const srcY = (pos / COLS) | 0;

    let upY = 0, downY = ROWS - 1, leftX = 0, rightX = COLS - 1;

    for (const wy of hWalls[srcX]) {
      if (wy <= srcY && wy > upY) upY = wy;
      if (wy > srcY && wy - 1 < downY) downY = wy - 1;
    }
    for (const wx of vWalls[srcY]) {
      if (wx <= srcX && wx > leftX) leftX = wx;
      if (wx > srcX && wx - 1 < rightX) rightX = wx - 1;
    }

    for (let qi = 0; qi < n; qi++) {
      if (qi === pi) continue;
      const opos = pool[offset + qi];
      const ox = opos % COLS;
      const oy = (opos / COLS) | 0;
      if (oy === srcY) {
        if (ox < srcX && ox >= leftX) leftX = ox + 1;
        if (ox > srcX && ox <= rightX) rightX = ox - 1;
      } else if (ox === srcX) {
        if (oy < srcY && oy >= upY) upY = oy + 1;
        if (oy > srcY && oy <= downY) downY = oy - 1;
      }
    }

    const c0 = upY !== srcY ? upY * COLS + srcX : -1;
    const c1 = downY !== srcY ? downY * COLS + srcX : -1;
    const c2 = leftX !== srcX ? srcY * COLS + leftX : -1;
    const c3 = rightX !== srcX ? srcY * COLS + rightX : -1;

    for (let ci = 0; ci < 4; ci++) {
      const toPos = ci === 0 ? c0 : ci === 1 ? c1 : ci === 2 ? c2 : c3;
      if (toPos === -1) continue;
      let occupied = false;
      for (let qi = 0; qi < n; qi++) {
        if (pool[offset + qi] === toPos) {
          occupied = true;
          break;
        }
      }
      if (!occupied) {
        buf[count++] = pos;
        buf[count++] = toPos;
      }
    }
  }

  return count;
}

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
  parentIdxs: Int32Array,
  fromPoss: Uint8Array,
  toposs: Uint8Array,
  goalIdx: number,
): Move[] {
  const path: Array<[number, number]> = [];
  let idx = goalIdx;
  while (parentIdxs[idx] !== -1) {
    path.push([fromPoss[idx], toposs[idx]]);
    idx = parentIdxs[idx];
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
  const wallIndex = indexWalls(board.walls);
  const initialState = initState(board);

  if (initialState[0] === destPos) return [];

  const PIECE_COUNT = initialState.length;

  // State pool: all states packed flat — no heap object per state
  const statePool = new Uint8Array(BFS_STATE_LIMIT * PIECE_COUNT);
  statePool.set(initialState, 0);

  // Parallel arrays for entry metadata
  const parentIdxs = new Int32Array(BFS_STATE_LIMIT).fill(-1);
  const fromPoss = new Uint8Array(BFS_STATE_LIMIT);
  const toposs = new Uint8Array(BFS_STATE_LIMIT);
  const depths = new Uint8Array(BFS_STATE_LIMIT); // max depth 15 fits in u8

  // Pre-allocated moves buffer: 4 directions × n pieces × 2 values
  const moveBuf = new Uint8Array(PIECE_COUNT * 8);

  const visited = new CompactSet();
  visited.add(stateKeyAt(statePool, 0, PIECE_COUNT));

  let entryCount = 1;
  let front = 0;
  let hitMaxDepth = false;

  while (front < entryCount) {
    if (entryCount >= BFS_STATE_LIMIT) {
      throw new SolverDepthExceededError(maxDepth);
    }

    const stateOff = front * PIECE_COUNT;
    const depth = depths[front];
    const parentIdx = front;
    front++;

    if (depth >= maxDepth) {
      hitMaxDepth = true;
      continue;
    }

    const moveCount = getMoves(statePool, stateOff, PIECE_COUNT, wallIndex, moveBuf);

    for (let i = 0; i < moveCount; i += 2) {
      const fromPos = moveBuf[i];
      const toPos = moveBuf[i + 1];

      // Write next state directly into statePool at entryCount offset
      const nextOff = entryCount * PIECE_COUNT;
      applyMoveInto(statePool, stateOff, PIECE_COUNT, fromPos, toPos, nextOff);

      const key = stateKeyAt(statePool, nextOff, PIECE_COUNT);
      if (visited.has(key)) continue;
      visited.add(key);

      parentIdxs[entryCount] = parentIdx;
      fromPoss[entryCount] = fromPos;
      toposs[entryCount] = toPos;
      depths[entryCount] = depth + 1;

      if (statePool[nextOff] === destPos) {
        return reconstructPath(parentIdxs, fromPoss, toposs, entryCount);
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
