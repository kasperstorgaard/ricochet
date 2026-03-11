import { COLS, getTargets, isPositionSame } from "#/game/board.ts";
import type { Board, Move, Piece, Puzzle } from "#/game/types.ts";

/**
 * Default solver limits.
 */
const DEFAULT_MAX_DEPTH = 20;
const DEFAULT_MAX_ITERATIONS = 1_000_000;
const ITERATIONS_REPORT_INCREMENT = 10_000;

/**
 * Solver configuration options.
 */
type SolverOptions = {
  // Maximum search depth in moves (default: 20)
  maxDepth?: number;
  // Maximum states to explore (default: 1,000,000)
  maxIterations?: number;
};

// Error thrown when the solver exceeds the maximum number of iterations
export class SolverLimitExceededError extends Error {
  constructor(limit: number) {
    super(`Solver limit ${limit} exceeded`);
    this.name = "SolverLimitExceededError";
  }
}

// Error thrown when the solver exceeds the maximum search depth
export class SolverDepthExceededError extends Error {
  constructor(depth: number) {
    super(`Solver depth ${depth} exceeded`);
    this.name = "SolverDepthExceededError";
  }
}

export type SolverProgress = { depth: number; states: number };
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
 * BFS state entry using parent pointers instead of copying move arrays.
 * Reconstruct path by walking parentIdx chain on solution found.
 */
type Entry = {
  pieces: CompactPiece[];
  parentIdx: number;
  move: Move | null;
  depth: number;
};

/**
 * Core BFS as a sync generator. Yields progress events at each new depth level
 * and at each iteration increment, then yields the solution event when found.
 * Throws SolverLimitExceededError, SolverDepthExceededError, or "Unsolvable puzzle".
 */
function* bfsGen(
  board: Board,
  options: SolverOptions,
): Generator<SolverEvent> {
  const { destination, walls } = board;
  const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
  const maxIterations = options.maxIterations ?? DEFAULT_MAX_ITERATIONS;

  const initialPieces = board.pieces.map(toCompact);
  const visited = new Set([serializeState(initialPieces)]);

  const states: Entry[] = [{
    pieces: initialPieces,
    parentIdx: -1,
    move: null,
    depth: 0,
  }];

  let head = 0;
  let lastReportedDepth = -1;
  let lastReportedIterations = 0;

  while (head < states.length) {
    if (head > maxIterations) {
      throw new SolverLimitExceededError(maxIterations);
    }

    const current = states[head];

    if (
      current.depth > lastReportedDepth ||
      head - lastReportedIterations >= ITERATIONS_REPORT_INCREMENT
    ) {
      lastReportedDepth = current.depth;
      lastReportedIterations = head;
      yield { type: "progress", depth: current.depth, states: head };
    }

    if (current.depth >= maxDepth) {
      throw new SolverDepthExceededError(maxDepth);
    }

    for (const move of generateAllMoves(current.pieces, walls)) {
      const newPieces = applyMove(current.pieces, move);
      const stateKey = serializeState(newPieces);

      if (visited.has(stateKey)) continue;
      visited.add(stateKey);

      const idx = states.length;
      states.push({ pieces: newPieces, parentIdx: head, move, depth: current.depth + 1 });

      const puck = newPieces.find((p) => p.type === "puck")!;
      const puckPos = { x: puck.pos % COLS, y: Math.floor(puck.pos / COLS) };

      if (isPositionSame(puckPos, destination)) {
        yield { type: "solution", moves: reconstructPath(states, idx) };
        return;
      }
    }

    head++;
  }

  throw new Error("Unsolvable puzzle");
}

/**
 * Solves a Skub puzzle using BFS to find the minimum move solution.
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
 * Async generator variant of solve. Yields progress events and the final
 * solution event, yielding control to the event loop between depth levels
 * so that streaming responses can flush progress to the client.
 */
export async function* solveStream(
  puzzleOrBoard: Puzzle | Board,
  options: SolverOptions = {},
): AsyncGenerator<SolverEvent> {
  const board = "board" in puzzleOrBoard ? puzzleOrBoard.board : puzzleOrBoard;

  for (const event of bfsGen(board, options)) {
    yield event;
    if (event.type === "progress") {
      await new Promise((r) => setTimeout(r, 0));
    }
  }
}

/**
 * Walks the parent pointer chain to reconstruct the solution path.
 */
function reconstructPath(states: Entry[], idx: number): Move[] {
  const moves: Move[] = [];
  let current = idx;
  while (states[current].move !== null) {
    moves.push(states[current].move!);
    current = states[current].parentIdx;
  }
  return moves.reverse();
}

/**
 * Fast state key using numeric positions.
 */
function serializeState(pieces: CompactPiece[]): number {
  const sorted = [...pieces].sort((a, b) => {
    if (a.type === "puck" && b.type !== "puck") return -1;
    if (a.type !== "puck" && b.type === "puck") return 1;
    return a.pos - b.pos;
  });

  let key = 0;
  for (let i = 0; i < sorted.length; i++) {
    key = key * 64 + sorted[i].pos;
  }
  return key;
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
function generateAllMoves(pieces: CompactPiece[], walls: Board["walls"]): Move[] {
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
  return { x: piece.pos % COLS, y: Math.floor(piece.pos / COLS), type: piece.type };
}
