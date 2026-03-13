import { COLS, ROWS } from "#/game/board.ts";
import type { Board, Move, Puzzle } from "#/game/types.ts";

/**
 * Default solver limits.
 */
const DEFAULT_MAX_DEPTH = 15;

/**
 * Solver configuration options.
 */
type SolverOptions = {
  // Maximum search depth in moves (default: 15)
  maxDepth?: number;
};

// Error thrown when the solver exceeds the maximum search depth
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

type WallIndex = {
  /** hWalls[x] = y-values of horizontal walls that block vertical movement in column x */
  hWalls: number[][];
  /** vWalls[y] = x-values of vertical walls that block horizontal movement in row y */
  vWalls: number[][];
};

/**
 * Pre-indexes walls by column/row so each move only iterates relevant walls.
 */
function indexWalls(walls: Board["walls"]): WallIndex {
  const hWalls: number[][] = Array.from({ length: COLS }, () => []);
  const vWalls: number[][] = Array.from({ length: ROWS }, () => []);
  for (const wall of walls) {
    if (wall.orientation === "horizontal") hWalls[wall.x].push(wall.y);
    else vWalls[wall.y].push(wall.x);
  }
  return { hWalls, vWalls };
}

function initState(board: Board): State {
  const puck = board.pieces.find((p) => p.type === "puck")!;
  const blockers = board.pieces
    .filter((p) => p.type === "blocker")
    .map((p) => p.y * COLS + p.x)
    .sort((a, b) => a - b);
  return new Uint8Array([puck.y * COLS + puck.x, ...blockers]);
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
 * Returns flat move pairs [from0, to0, from1, to1, …] for all valid moves
 * from the current state. Skips moves where the piece can't move in that direction.
 *
 * Wall constraints narrow the axis-aligned range; piece constraints narrow it further.
 * Target occupancy is checked last to avoid emitting blocked squares.
 */
function getMoves(state: State, { hWalls, vWalls }: WallIndex): number[] {
  const moves: number[] = [];
  const n = state.length;

  for (let pi = 0; pi < n; pi++) {
    const pos = state[pi];
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
 * Admissible heuristic: lower bound on moves remaining.
 *   0 — puck already at destination
 *   1 — puck shares row or column with destination
 *   2 — at least two moves needed
 *
 * Does not check walls — would cost more than it saves per node.
 */
function heuristic(puckPos: number, destPos: number): number {
  if (puckPos === destPos) return 0;
  if (
    puckPos % COLS === destPos % COLS ||
    (puckPos / COLS | 0) === (destPos / COLS | 0)
  ) return 1;
  return 2;
}

function extractMoves(moveHistory: number[]): Move[] {
  const moves: Move[] = [];
  for (let i = 0; i < moveHistory.length; i += 2) {
    const from = moveHistory[i], to = moveHistory[i + 1];
    moves.push([
      { x: from % COLS, y: (from / COLS) | 0 },
      { x: to % COLS, y: (to / COLS) | 0 },
    ]);
  }
  return moves;
}

type RbfsResult =
  | { found: true; moves: Move[] }
  | { found: false; nextF: number };

/**
 * Core RBFS (Recursive Best-First Search) — finds optimal solution.
 *
 * Like A* but uses O(depth × branching) memory instead of O(b^d).
 * Each node stores an f-value; when backtracking, the caller inherits the
 * best f-value seen in the subtree so it knows when to re-expand vs. try
 * the next best sibling. This avoids IDA*'s complete re-expansion per pass.
 *
 * @param state    Current board state
 * @param g        Moves made so far (depth)
 * @param myF      f-value assigned to this node — max(g+h, parent.f)
 * @param fLimit   Do not expand nodes with f > fLimit (parent's best alt)
 * @param moveHistory Flat [from, to, …] pairs for the current path
 */
function rbfs(
  state: State,
  g: number,
  myF: number,
  fLimit: number,
  moveHistory: number[],
  destPos: number,
  wallIndex: WallIndex,
  maxDepth: number,
): RbfsResult {
  if (myF > fLimit) return { found: false, nextF: myF };

  if (state[0] === destPos) {
    return { found: true, moves: extractMoves(moveHistory) };
  }

  if (g >= maxDepth) return { found: false, nextF: Infinity };

  const movePairs = getMoves(state, wallIndex);
  if (movePairs.length === 0) return { found: false, nextF: Infinity };

  const count = movePairs.length >> 1;
  const succStates: State[] = new Array(count);
  const succFrom: number[] = new Array(count);
  const succTo: number[] = new Array(count);
  const succF: number[] = new Array(count);

  for (let i = 0; i < count; i++) {
    const fromPos = movePairs[i * 2], toPos = movePairs[i * 2 + 1];
    const next = applyMove(state, fromPos, toPos);
    // Inherit parent f if child f is lower — ensures non-decreasing f along path
    const childF = Math.max(g + 1 + heuristic(next[0], destPos), myF);
    succStates[i] = next;
    succFrom[i] = fromPos;
    succTo[i] = toPos;
    succF[i] = childF;
  }

  for (;;) {
    // Best successor: minimum f
    let bestIdx = 0;
    for (let i = 1; i < count; i++) {
      if (succF[i] < succF[bestIdx]) bestIdx = i;
    }

    if (succF[bestIdx] > fLimit) return { found: false, nextF: succF[bestIdx] };

    // Best alternative f (second-lowest)
    let altF = Infinity;
    for (let i = 0; i < count; i++) {
      if (i !== bestIdx && succF[i] < altF) altF = succF[i];
    }

    moveHistory.push(succFrom[bestIdx], succTo[bestIdx]);
    const result = rbfs(
      succStates[bestIdx],
      g + 1,
      succF[bestIdx],
      Math.min(fLimit, altF),
      moveHistory,
      destPos,
      wallIndex,
      maxDepth,
    );
    moveHistory.pop();
    moveHistory.pop();

    if (result.found) return result;
    // Update f so siblings with lower f get tried first next iteration
    succF[bestIdx] = result.nextF;
  }
}

/**
 * Solves a board using RBFS, yielding a progress event then the solution.
 *
 * RBFS is a single-pass algorithm — no repeated depth thresholds like IDA*.
 * It re-expands nodes only when a sibling's f-value is lower, which is far
 * less than IDA*'s full-depth re-expansion per pass.
 *
 * Yields:
 *   { type: "progress", depth: 1 }  — signals search has started
 *   { type: "solution", moves }      — optimal move sequence
 *
 * Throws SolverDepthExceededError when no solution is found within maxDepth.
 */
export function* solve(
  puzzleOrBoard: Board | Puzzle,
  options: SolverOptions = {},
): Generator<SolverEvent> {
  const board = "board" in puzzleOrBoard ? puzzleOrBoard.board : puzzleOrBoard;
  const { destination, walls } = board;
  const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;

  const destPos = destination.y * COLS + destination.x;
  const wallIndex = indexWalls(walls);
  const initialState = initState(board);
  const initialH = heuristic(initialState[0], destPos);

  yield { type: "progress", depth: 1 };

  const result = rbfs(
    initialState,
    0,
    initialH,
    Infinity,
    [],
    destPos,
    wallIndex,
    maxDepth,
  );

  if (result.found) {
    yield { type: "solution", moves: result.moves };
    return;
  }

  throw new SolverDepthExceededError(maxDepth);
}

/**
 * Solves a puzzle synchronously using RBFS to find the minimum move solution.
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
