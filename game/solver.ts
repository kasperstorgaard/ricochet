import { COLS, getTargets } from "#/game/board.ts";
import type { Board, Move, Piece, Puzzle } from "#/game/types.ts";

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
 * Compact piece representation for efficient state handling.
 * Stores position as a single number (y * COLS + x) for fast comparison.
 */
type CompactPiece = {
  pos: number; // y * COLS + x
  type: "puck" | "blocker";
};

/**
 * Admissible heuristic: lower bound on moves remaining.
 *   0 — puck already at destination
 *   1 — puck shares row or column with destination (might reach in one slide)
 *   2 — puck needs at least two moves to reach destination
 *
 * Ignores walls intentionally — checking walls costs more than it saves per node.
 * Never overestimates, so A* optimality is preserved.
 */
function heuristic(puckPos: number, destPos: number): number {
  if (puckPos === destPos) return 0;
  if (
    puckPos % COLS === destPos % COLS ||
    Math.floor(puckPos / COLS) === Math.floor(destPos / COLS)
  ) return 1;
  return 2;
}

/**
 * Core IDA* search as a sync generator.
 *
 * Uses O(depth) stack memory — no states array, no global visited set, no heap.
 * A within-pass transposition table (TT) prevents re-exploring states at the
 * same or higher cost within a threshold pass, matching A* efficiency per pass.
 * The TT is cleared between passes so memory stays proportional to states
 * explored in the current pass, not the entire search.
 *
 * Yields a progress event before each threshold pass, then yields the solution
 * event when found. Throws SolverDepthExceededError or "Unsolvable puzzle".
 */
export function* bfsGen(
  board: Board,
  options: SolverOptions,
): Generator<SolverEvent> {
  const { destination, walls } = board;
  const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;

  const destPos = destination.y * COLS + destination.x;
  const initialPieces = board.pieces.map(toCompact);
  const initialPuck = initialPieces.find((p) => p.type === "puck")!;

  let threshold = heuristic(initialPuck.pos, destPos);

  // Reusable move history — avoids array allocation per recursive call.
  const moveHistory: Move[] = [];

  // Within-pass transposition table: state key → minimum g-cost seen this pass.
  // Cleared between passes so memory stays bounded to the current pass.
  const tt = new Map<string, number>();

  function dfs(pieces: CompactPiece[], g: number): Move[] | number {
    const key = serializeState(pieces);
    const best = tt.get(key);
    if (best !== undefined && best <= g) return Infinity;
    tt.set(key, g);

    const puck = pieces.find((p) => p.type === "puck")!;
    const f = g + heuristic(puck.pos, destPos);

    if (f > threshold) return f;
    if (puck.pos === destPos) return [...moveHistory];

    let minNext = Infinity;

    for (const move of generateAllMoves(pieces, walls)) {
      const newPieces = applyMove(pieces, move);
      moveHistory.push(move);
      const result = dfs(newPieces, g + 1);
      moveHistory.pop();
      if (Array.isArray(result)) return result;
      if (result < minNext) minNext = result;
    }

    return minNext;
  }

  while (threshold <= maxDepth) {
    tt.clear();
    yield { type: "progress", depth: threshold };

    const result = dfs(initialPieces, 0);

    if (Array.isArray(result)) {
      yield { type: "solution", moves: result };
      return;
    }

    if (result === Infinity) throw new Error("Unsolvable puzzle");

    threshold = result;
  }

  throw new SolverDepthExceededError(maxDepth);
}

/**
 * Solves a Skub puzzle using IDA* to find the minimum move solution.
 */
export function solve(
  puzzleOrBoard: Puzzle | Board,
  options: SolverOptions = {},
): Move[] {
  const board = "board" in puzzleOrBoard ? puzzleOrBoard.board : puzzleOrBoard;

  for (const event of bfsGen(board, options)) {
    if (event.type === "solution") return event.moves;
  }

  throw new Error("Unsolvable puzzle");
}

/**
 * String state key — safe for any number of pieces (no float precision overflow).
 * Puck first, then blockers sorted by position.
 */
function serializeState(pieces: CompactPiece[]): string {
  return [...pieces]
    .sort((a, b) => {
      if (a.type === "puck" && b.type !== "puck") return -1;
      if (a.type !== "puck" && b.type === "puck") return 1;
      return a.pos - b.pos;
    })
    .map((p) => `${p.type[0]}${p.pos}`)
    .join(",");
}

/**
 * Applies a move directly without validation.
 */
function applyMove(pieces: CompactPiece[], move: Move): CompactPiece[] {
  const fromPos = move[0].y * COLS + move[0].x;
  const toPos = move[1].y * COLS + move[1].x;
  return pieces.map((p) => p.pos === fromPos ? { ...p, pos: toPos } : p);
}

/**
 * Generates all valid moves from the current board state.
 */
function generateAllMoves(
  pieces: CompactPiece[],
  walls: Board["walls"],
): Move[] {
  const moves: Move[] = [];
  const fullPieces = pieces.map(fromCompact);

  for (const piece of fullPieces) {
    const targets = getTargets(piece, { pieces: fullPieces, walls });
    for (const target of Object.values(targets)) {
      if (target) moves.push([{ x: piece.x, y: piece.y }, target]);
    }
  }

  return moves;
}

function toCompact(piece: Piece): CompactPiece {
  return { pos: piece.y * COLS + piece.x, type: piece.type };
}

function fromCompact(piece: CompactPiece): Piece {
  return {
    x: piece.pos % COLS,
    y: Math.floor(piece.pos / COLS),
    type: piece.type,
  };
}
