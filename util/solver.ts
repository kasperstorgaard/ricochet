import { COLS, getTargets, isPositionSame } from "#/util/board.ts";
import type { Board, Move, Piece, Position, Puzzle } from "#/util/types.ts";

/**
 * Default solver limits.
 */
const DEFAULT_MAX_DEPTH = 20;
const DEFAULT_MAX_ITERATIONS = 500_000;

/**
 * Solver configuration options.
 */
type SolverOptions = {
  /** Maximum search depth in moves (default: 20) */
  maxDepth?: number;
  /** Maximum states to explore (default: 100,000) */
  maxIterations?: number;
};

export class SolverLimitExceededError extends Error {
  constructor(limit: number) {
    super(`Solver limit ${limit} exceeded`);
    this.name = "SolverLimitExceededError";
  }
}

export class SolverDepthExceededError extends Error {
  constructor(depth: number) {
    super(`Solver depth ${depth} exceeded`);
    this.name = "SolverDepthExceededError";
  }
}

/**
 * Compact piece representation for efficient state handling.
 * Stores position as a single number (y * COLS + x) for fast comparison.
 */
type CompactPiece = {
  pos: number; // y * COLS + x
  type: "rook" | "bouncer";
};

/**
 * BFS search state with compact representation.
 */
type SearchState = {
  pieces: CompactPiece[];
  moves: Move[];
};

/**
 * Solves a Ricochet puzzle using BFS to find the minimum move solution.
 *
 * @param puzzleOrBoard - The puzzle or board to solve
 * @param options - Optional solver configuration
 * @returns The solution as Move[] or null if no solution found within limits
 */
export function solve(
  puzzleOrBoard: Puzzle | Board,
  options: SolverOptions = {},
): Move[] | null {
  const board = "board" in puzzleOrBoard ? puzzleOrBoard.board : puzzleOrBoard;
  const { destination, walls } = board;

  const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
  const maxIterations = options.maxIterations ?? DEFAULT_MAX_ITERATIONS;

  // Add initial state
  const initialPieces = board.pieces.map(toCompact);
  const initialKey = serializeState(initialPieces);

  const visited = new Set([initialKey]);
  const queue = [{
    pieces: initialPieces,
    moves: [] as Move[],
  }];

  for (let queueHead = 1; queueHead < queue.length; queueHead++) {
    if (queueHead > maxIterations) {
      throw new SolverLimitExceededError(maxIterations);
    }

    const current = queue[queueHead];

    if (current.moves.length >= maxDepth) {
      throw new SolverDepthExceededError(maxDepth);
    }

    // Convert to full pieces for move generation (needed by getTargets)
    const fullPieces = current.pieces.map(fromCompact);

    // Generate all possible moves from current state
    const possibleMoves = generateAllMoves(fullPieces, walls);

    for (const move of possibleMoves) {
      const newPieces = applyMove(current.pieces, move);
      const stateKey = serializeState(newPieces);

      // Skip if we've seen this configuration
      if (visited.has(stateKey)) continue;
      visited.add(stateKey);

      const newMoves = [...current.moves, move];

      // Check if this is a solution (rook at destination)
      const rookPiece = newPieces.find((p) => p.type === "rook")!;
      const rookPos = {
        x: rookPiece.pos % COLS,
        y: Math.floor(rookPiece.pos / COLS),
      };
      if (isPositionSame(rookPos, destination)) {
        return newMoves;
      }

      // Add to queue for further exploration
      queue.push({ pieces: newPieces, moves: newMoves });
    }
  }

  return null;
}

/**
 * Fast state key using numeric positions.
 * Since positions are 0-63 on an 8x8 board, we can pack them efficiently.
 */
function serializeState(pieces: CompactPiece[]): number {
  // Sort: rook first, then by position
  const sorted = [...pieces].sort((a, b) => {
    if (a.type === "rook" && b.type !== "rook") return -1;
    if (a.type !== "rook" && b.type === "rook") return 1;
    return a.pos - b.pos;
  });

  // Pack into a single number (works for up to ~8 pieces on 8x8 board)
  // Each position needs 6 bits (0-63), so we can fit 8 pieces in 48 bits
  let key = 0;
  for (let i = 0; i < sorted.length; i++) {
    key = key * 64 + sorted[i].pos;
  }
  return key;
}

/**
 * Applies a move directly without validation (we know it's valid from generateMoves).
 */
function applyMove(
  pieces: CompactPiece[],
  move: Move,
): CompactPiece[] {
  const fromPos = move[0].y * COLS + move[0].x;
  const toPos = move[1].y * COLS + move[1].x;

  return pieces.map((p) => p.pos === fromPos ? { ...p, pos: toPos } : p);
}

/**
 * Generates all valid moves from the current board state.
 * Each piece can potentially move in 4 directions (up, right, down, left).
 */
function generateAllMoves(
  pieces: Piece[],
  walls: Board["walls"],
): Move[] {
  const moves: Move[] = [];

  for (const piece of pieces) {
    const targets = getTargets(piece, { pieces, walls });

    for (const target of Object.values(targets)) {
      if (target) {
        moves.push([{ x: piece.x, y: piece.y }, target]);
      }
    }
  }

  return moves;
}

/**
 * Converts pieces to compact representation.
 */
function toCompact(piece: Piece): CompactPiece {
  return {
    pos: piece.y * COLS + piece.x,
    type: piece.type,
  };
}

/**
 * Converts compact piece back to full piece.
 */
function fromCompact(piece: CompactPiece): Piece {
  return {
    x: piece.pos % COLS,
    y: Math.floor(piece.pos / COLS),
    type: piece.type,
  };
}
