import { Board, Move, Piece, Position, Wall } from "#/util/types.ts";

/**
 * The board dimensions.
 * background: 8 rows and cols align well with hex and comp-science,
 * so a useful/fun limit, while providing benefits.
 */
export const COLS = 8;
export const ROWS = 8;

/**
 * Custom error for invalid board states.
 */
export class BoardError extends Error {
  constructor() {
    super("Board is invalid");
  }
}

/**
 * Board type to use when inputting potentially incomplete board data.
 */
export type BoardLike = {
  destination: Position | null | undefined;
  walls: (Wall | null | undefined)[] | undefined | null;
  pieces: (Piece | null | undefined)[] | undefined | null;
};

/**
 * Checks if two positions are aligned either horizontally or vertically.
 * @param src The source position
 * @param target The target position to compare against
 * @returns true if aligned, otherwise false
 */
export function isPositionAligned(src: Position, target: Position) {
  return src.x === target.x || src.y === target.y;
}

/**
 * Checks if a given position is out bounds of the board.
 * @param src The position to check
 * @returns true if out of bounds, otherwise false
 */
export function isPositionOutOfBounds(
  src: Position,
) {
  return (
    src.x < 0 ||
    src.x >= COLS ||
    src.y < 0 ||
    src.y >= ROWS
  );
}

/**
 * Checks if two positions are identical.
 * @param src The source position
 * @param target The target position to compare against.
 * @returns True if identical, otherwise false
 */
export function isPositionSame(src: Position, target: Position) {
  return src.x === target.x && src.y === target.y;
}

/**
 * Validates the board structure and contents, returning a sanitized Board object.
 * Can be consumed as a truthy check or a means to get a properly typed Board.
 * Will throw BoardError if invalid.
 */
// TODO: add more specific board error messages.
export function validateBoard(board: BoardLike): Board {
  if (!board) throw new BoardError();

  const { destination, pieces, walls } = board;
  if (!pieces?.length) throw new BoardError();

  if (!destination) throw new BoardError();

  if (isPositionOutOfBounds(destination)) throw new BoardError();

  const checkedPieces: Piece[] = [];
  for (const piece of pieces) {
    // Check for invalid pieces
    if (piece == null || !piece.type || piece.x == null || piece.y == null) {
      throw new BoardError();
    }

    // Check for out of bounds pieces
    if (isPositionOutOfBounds(piece)) throw new BoardError();

    // Check for identical piece positions
    const hasIdenticalPieces = checkedPieces.some((checkedPiece) =>
      isPositionSame(piece, checkedPiece)
    );

    if (hasIdenticalPieces) throw new BoardError();

    checkedPieces.push(piece);
  }

  // Make sure a rook exists
  const rook = pieces.find((piece) => piece?.type === "rook");
  if (!rook) throw new BoardError();

  const checkedWalls: Wall[] = [];

  for (const wall of walls ?? []) {
    // Check for invalid walls
    if (wall == null || !wall.orientation || wall.x == null || wall.y == null) {
      throw new BoardError();
    }

    // Check for out of bounds walls
    if (isPositionOutOfBounds(wall)) throw new BoardError();

    // Check for duplicate walls
    if (
      checkedWalls.some((checkedWall) =>
        isPositionSame(wall, checkedWall) &&
        wall.orientation === checkedWall.orientation
      )
    ) {
      throw new BoardError();
    }

    checkedWalls.push(wall);
  }

  return {
    destination,
    pieces: checkedPieces,
    walls: checkedWalls,
  };
}

/**
 * The positions in each direction a piece can move to.
 * undefined means the piece cannot move in that direction.
 * empty object means the piece cannot move at all.
 */
export type Targets = {
  up?: Position;
  right?: Position;
  down?: Position;
  left?: Position;
};

/**
 * Gets the furthest possible position a piece can move in each direction,
 * blocked by walls, other pieces and board edges.
 *
 * An empty direction means the piece cannot move in that direction.
 * An empty object means the piece cannot move at all.
 *
 * @param src The starting position
 * @param board The board state
 * @returns The possible target positions of the piece
 */
export function getTargets(
  src: Position,
  { walls, pieces }: Pick<Board, "pieces" | "walls">,
): Targets {
  const up = { x: src.x, y: 0 };
  const right = { x: COLS - 1, y: src.y };
  const down = { x: src.x, y: ROWS - 1 };
  const left = { x: 0, y: src.y };

  const targetPiece = pieces.find((piece) => isPositionSame(piece, src));
  if (!targetPiece) return {};

  /**
   * Determine if any walls are in between src position and current targets
   * note: walls can be on the same space as src, the `<=` and `=>` and off by 1 account for that.
   */
  for (const wall of walls) {
    if (wall.y === src.y && wall.orientation === "vertical") {
      if (wall.x <= src.x && wall.x > left.x) {
        left.x = wall.x;
      }

      if (wall.x > src.x && wall.x <= right.x) {
        right.x = wall.x - 1;
      }
    } else if (wall.x === src.x && wall.orientation === "horizontal") {
      if (wall.y <= src.y && wall.y > up.y) {
        up.y = wall.y;
      }

      if (wall.y > src.y && wall.y <= down.y) {
        down.y = wall.y - 1;
      }
    }
  }

  for (const piece of pieces) {
    if (piece.y === src.y && piece.x === src.x) continue;

    if (piece.y === src.y) {
      if (piece.x <= src.x && piece.x >= left.x) {
        left.x = piece.x + 1;
      }

      if (piece.x >= src.x && piece.x <= right.x) {
        right.x = piece.x - 1;
      }
    } else if (piece.x === src.x) {
      if (piece.y <= src.y && piece.y >= up.y) {
        up.y = piece.y + 1;
      }

      if (piece.y >= src.y && piece.y <= down.y) {
        down.y = piece.y - 1;
      }
    }
  }

  // Check for overlaps, and only add targets where not found
  const lookup: Targets = {};
  for (const [key, target] of Object.entries({ up, right, down, left })) {
    const hasOverlap = pieces.some((piece) => isPositionSame(piece, target));

    if (!hasOverlap) {
      lookup[key as keyof Targets] = target;
    }
  }

  return lookup;
}

/**
 * Check if a move between to positions is valid given a board state.
 * @param move
 * @param board
 * @returns true if valid, otherwise false
 */
export function isValidMove(
  move: Move,
  board: Pick<Board, "pieces" | "walls">,
) {
  const matchingPiece = board.pieces.find((piece) =>
    isPositionSame(piece, move[0])
  );

  if (!matchingPiece) return false;

  const targets = getTargets(move[0], board);

  for (const possibleTarget of Object.values(targets)) {
    if (isPositionSame(possibleTarget, move[1])) return true;
  }

  return false;
}

/**
 * Resolves a series of moves given a board state.
 * Will throw if any move is not valid.
 * @param board
 * @param moves
 * @returns updated board state.
 */
export function resolveMoves<
  TBoard extends Pick<Board, "pieces" | "walls"> = Pick<
    Board,
    "pieces" | "walls"
  >,
>(
  board: TBoard,
  moves: Move[],
): TBoard {
  const updatedBoard = { ...board };

  for (const move of moves) {
    if (!isValidMove(move, updatedBoard)) {
      throw new Error(
        `Invalid move, ${move[0].x}_${move[0].y}->${move[1].x}_${move[1].y}`,
      );
    }

    updatedBoard.pieces = updatedBoard.pieces.map((piece) =>
      isPositionSame(piece, move[0]) ? { ...piece, ...move[1] } : piece
    );
  }

  return updatedBoard;
}

/**
 * Check if the current board state is a valid solution
 * @param board The current board state
 * @returns true if valid solution, otherwise false
 */
export function isValidSolution(board: Pick<Board, "destination" | "pieces">) {
  for (const piece of board.pieces) {
    if (piece.type === "bouncer") continue;

    if (isPositionSame(piece, board.destination)) return true;
  }

  return false;
}

export function getMoveDirection(move: Move) {
  if (move[0].x === move[1].x) {
    return move[1].y > move[0].y ? "down" : "up";
  }

  return move[1].x > move[0].x ? "right" : "left";
}
