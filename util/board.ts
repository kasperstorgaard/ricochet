import { Board, Move, Piece, Position, Wall } from "../db/types.ts";

// 8 rows and cols align well with hex and comp-science, so a useful/fun limit.
const COLS = 8;
const ROWS = 8;

export class BoardError extends Error {
  constructor() {
    super("Board is invalid");
  }
}

export type BoardLike = {
  destination: Position | null | undefined;
  walls: (Wall | null | undefined)[] | undefined | null;
  pieces: (Piece | null | undefined)[] | undefined | null;
};

export function isPositionAligned(src: Position, target: Position) {
  return src.x === target.x || src.y === target.y;
}

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

export function getPieceId(piece: Piece, idx: number) {
  return `${piece.type === "rook" ? "r" : "b"}_${idx}`;
}

export function isPositionSame(src: Position, target: Position) {
  return src.x === target.x && src.y === target.y;
}

export function validateBoard(board: BoardLike): Board {
  if (!board) throw new BoardError();

  const { destination, pieces, walls } = board;
  if (!pieces?.length) throw new BoardError();

  if (!destination) throw new BoardError();

  if (isPositionOutOfBounds(destination)) {
    throw new BoardError();
  }

  const checkedPieces: Piece[] = [];
  for (const piece of pieces) {
    if (piece == null || !piece.type || piece.x == null || piece.y == null) {
      throw new BoardError();
    }

    if (isPositionOutOfBounds(piece)) {
      throw new BoardError();
    }

    // Check for identical piece positions
    const match = checkedPieces.find((checkedPiece) =>
      isPositionSame(piece, checkedPiece)
    );
    if (match) {
      throw new BoardError();
    }

    checkedPieces.push(piece);
  }

  if (!pieces.some((piece) => piece?.type === "rook")) {
    throw new BoardError();
  }

  // Check for duplicate walls
  const checkedWalls: Wall[] = [];
  for (const wall of walls ?? []) {
    if (wall == null || !wall.orientation || wall.x == null || wall.y == null) {
      throw new BoardError();
    }
    if (isPositionOutOfBounds(wall)) {
      throw new BoardError();
    }

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

export type Targets = {
  up?: Position;
  right?: Position;
  down?: Position;
  left?: Position;
};

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

export function isValidSolution(board: Pick<Board, "destination" | "pieces">) {
  for (const piece of board.pieces) {
    if (piece.type === "bouncer") continue;

    if (isPositionSame(piece, board.destination)) return true;
  }

  return false;
}
