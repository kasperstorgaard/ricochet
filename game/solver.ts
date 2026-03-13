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

/**
 * State: Uint8Array [puckPos, ...blockerPositionsSortedAsc]
 * Positions are encoded as y * COLS + x.
 * Canonical order (puck at 0, blockers sorted) is maintained by applyMove,
 * so stateKey never needs to sort.
 */
type State = Uint8Array;

/**
 * Per-cell wall slide bounds — the furthest a piece can reach in each direction
 * considering only walls (not other pieces). Computed once per board.
 *
 * Indexed by position (y * COLS + x). Values are row/col coordinates:
 *   up[pos]    — lowest y the piece can reach sliding up
 *   down[pos]  — highest y the piece can reach sliding down
 *   left[pos]  — lowest x the piece can reach sliding left
 *   right[pos] — highest x the piece can reach sliding right
 */
type WallSlide = {
  up: Uint8Array;
  down: Uint8Array;
  left: Uint8Array;
  right: Uint8Array;
};

/**
 * Pre-computes wall slide bounds for every cell.
 * Replaces per-move wall iteration with O(1) lookups in getMoves.
 */
function buildWallSlide(walls: Board["walls"]): WallSlide {
  const size = COLS * ROWS;
  const up = new Uint8Array(size); // default 0
  const down = new Uint8Array(size).fill(ROWS - 1);
  const left = new Uint8Array(size); // default 0
  const right = new Uint8Array(size).fill(COLS - 1);

  for (const wall of walls) {
    if (wall.orientation === "horizontal") {
      // Horizontal wall at (wall.x, wall.y) blocks vertical movement in column wall.x
      const wy = wall.y;
      for (let y = 0; y < ROWS; y++) {
        const pos = y * COLS + wall.x;
        if (wy <= y && wy > up[pos]) up[pos] = wy;
        if (wy > y && wy - 1 < down[pos]) down[pos] = wy - 1;
      }
    } else {
      // Vertical wall at (wall.x, wall.y) blocks horizontal movement in row wall.y
      const wx = wall.x;
      for (let x = 0; x < COLS; x++) {
        const pos = wall.y * COLS + x;
        if (wx <= x && wx > left[pos]) left[pos] = wx;
        if (wx > x && wx - 1 < right[pos]) right[pos] = wx - 1;
      }
    }
  }

  return { up, down, left, right };
}

function initState(board: Board): State {
  const puck = board.pieces.find((p) => p.type === "puck")!;
  const blockers = board.pieces
    .filter((p) => p.type === "blocker")
    .map((p) => p.y * COLS + p.x)
    .sort((a, b) => a - b);
  return new Uint8Array([puck.y * COLS + puck.x, ...blockers]);
}

// Packed integer key — safe for up to 8 pieces (64^8 < Number.MAX_SAFE_INTEGER).
function stateKey(state: State): number {
  let key = 0;
  for (let i = 0; i < state.length; i++) key = key * 64 + state[i];
  return key;
}

/**
 * Returns a new state with fromPos replaced by toPos.
 * Maintains canonical order: puck at index 0, blockers sorted ascending.
 * Uses insertion sort on the single changed element — O(n) worst case.
 */
function applyMove(state: State, fromPos: number, toPos: number): State {
  const next = new Uint8Array(state);
  if (next[0] === fromPos) {
    next[0] = toPos;
    return next;
  }
  for (let i = 1; i < next.length; i++) {
    if (next[i] === fromPos) {
      next[i] = toPos;
      let j = i;
      while (j > 1 && next[j] < next[j - 1]) {
        const tmp = next[j];
        next[j] = next[j - 1];
        next[j - 1] = tmp;
        j--;
      }
      while (j < next.length - 1 && next[j] > next[j + 1]) {
        const tmp = next[j];
        next[j] = next[j + 1];
        next[j + 1] = tmp;
        j++;
      }
      return next;
    }
  }
  return next;
}

/**
 * Returns flat move pairs [from0, to0, from1, to1, …] for all valid moves.
 *
 * Wall constraints narrow the axis-aligned range; piece constraints narrow it further.
 * Target occupancy is checked last to avoid emitting blocked squares.
 */
function getMoves(state: State, ws: WallSlide): number[] {
  const moves: number[] = [];
  const n = state.length;

  for (let pi = 0; pi < n; pi++) {
    const pos = state[pi];
    const srcX = pos % COLS;
    const srcY = (pos / COLS) | 0;

    // Wall-limited bounds — O(1) lookup replacing two inner wall loops
    let upY = ws.up[pos];
    let downY = ws.down[pos];
    let leftX = ws.left[pos];
    let rightX = ws.right[pos];

    for (let qi = 0; qi < n; qi++) {
      if (qi === pi) continue;
      const opos = state[qi];
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

    const candidates: number[] = [
      upY !== srcY ? upY * COLS + srcX : -1,
      downY !== srcY ? downY * COLS + srcX : -1,
      leftX !== srcX ? srcY * COLS + leftX : -1,
      rightX !== srcX ? srcY * COLS + rightX : -1,
    ];

    for (const toPos of candidates) {
      if (toPos === -1) continue;
      let occupied = false;
      for (let qi = 0; qi < n; qi++) {
        if (state[qi] === toPos) {
          occupied = true;
          break;
        }
      }
      if (!occupied) {
        moves.push(pos);
        moves.push(toPos);
      }
    }
  }

  return moves;
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

/**
 * BFS queue entry. Uses parent-pointer path reconstruction to avoid storing
 * the full move history in every entry.
 */
type BfsEntry = {
  state: State;
  parentIdx: number; // -1 for root
  fromPos: number;
  toPos: number;
  depth: number;
};

function reconstructPath(entries: BfsEntry[], goalIdx: number): Move[] {
  const path: Array<[number, number]> = [];
  let idx = goalIdx;
  while (entries[idx].parentIdx !== -1) {
    path.push([entries[idx].fromPos, entries[idx].toPos]);
    idx = entries[idx].parentIdx;
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
 * Uses compact Uint8Array state with a numeric key so the visited Set is fast.
 * Path is reconstructed via parent pointers rather than storing full histories,
 * keeping per-entry memory minimal.
 *
 * Throws SolverDepthExceededError if the state count exceeds BFS_STATE_LIMIT
 * (very deep or wall-sparse boards) or if maxDepth is reached without solution.
 */
function bfsSolve(board: Board, maxDepth: number): Move[] {
  const destPos = board.destination.y * COLS + board.destination.x;
  const wallSlide = buildWallSlide(board.walls);
  const initialState = initState(board);

  if (initialState[0] === destPos) return [];

  const entries: BfsEntry[] = [
    { state: initialState, parentIdx: -1, fromPos: 0, toPos: 0, depth: 0 },
  ];
  const visited = new CompactSet();
  visited.add(stateKey(initialState));

  let front = 0;
  let hitMaxDepth = false;

  while (front < entries.length) {
    if (entries.length > BFS_STATE_LIMIT) {
      throw new SolverDepthExceededError(maxDepth);
    }

    const entry = entries[front];
    const parentIdx = front;
    front++;

    if (entry.depth >= maxDepth) {
      hitMaxDepth = true;
      continue;
    }

    const movePairs = getMoves(entry.state, wallSlide);

    for (let i = 0; i < movePairs.length; i += 2) {
      const fromPos = movePairs[i], toPos = movePairs[i + 1];
      const nextState = applyMove(entry.state, fromPos, toPos);
      const key = stateKey(nextState);

      if (visited.has(key)) continue;
      visited.add(key);

      const childIdx = entries.length;
      entries.push({
        state: nextState,
        parentIdx,
        fromPos,
        toPos,
        depth: entry.depth + 1,
      });

      if (nextState[0] === destPos) return reconstructPath(entries, childIdx);
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
