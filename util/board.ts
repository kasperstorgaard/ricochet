export type Position = {
  x: number;
  y: number;
};

export type Piece = Position & {
  type: "rook" | "bouncer";
};

export type Wall = Position & {
  orientation: "horizontal" | "vertical";
};

class BoardError extends Error {
  constructor(msg: string) {
    super(msg);
  }
}

export class EmptyBoardError extends BoardError {
  constructor() {
    super("Board is empty");
  }
}

export class NoRooksError extends BoardError {
  constructor() {
    super("Board contains no rooks");
  }
}

export class NoDestinationError extends BoardError {
  constructor() {
    super("Board has no destination");
  }
}

export class PiecesWithSamePositionError extends BoardError {
  constructor() {
    super("Board has two pieces in the same position");
  }
}

export class OutOfBoundsError extends BoardError {
  constructor(public readonly position: Position) {
    super("Position is out of bounds");
  }
}

export class DuplicateWallsError extends BoardError {
  constructor() {
    super("Board has two walls with the same position");
  }
}

export type BoardState = {
  cols: number;
  rows: number;
  destination: Position;
  walls: Wall[];
  pieces: Piece[];
};

export function isPositionAligned(src: Position, target: Position) {
  return src.x === target.x || src.y === target.y;
}

export function isPositionOutOfBounds(
  src: Position,
  board: { cols: number; rows: number },
) {
  return (
    src.x < 0 ||
    src.x >= board.cols ||
    src.y < 0 ||
    src.y >= board.rows
  );
}

export function isPositionSame(src: Position, target: Position) {
  return src.x === target.x && src.y === target.y;
}

export function validateBoard(src: BoardState) {
  if (!src.pieces.length) throw new EmptyBoardError();

  if (!src.pieces.some((piece) => piece.type === "rook")) {
    throw new NoRooksError();
  }

  if (!src.destination) throw new NoDestinationError();

  const checkedPieces: Position[] = [];
  for (const piece of src.pieces) {
    if (isPositionOutOfBounds(piece, src)) throw new OutOfBoundsError(piece);

    // Check for identical piece positions
    if (
      checkedPieces.some((checkedPiece) => isPositionSame(piece, checkedPiece))
    ) {
      throw new PiecesWithSamePositionError();
    }

    checkedPieces.push(piece);
  }

  // Check for duplicate walls
  const checkedWalls: Wall[] = [];
  for (const wall of src.walls) {
    if (isPositionOutOfBounds(wall, src)) throw new OutOfBoundsError(wall);

    if (
      checkedWalls.some((checkedWall) =>
        isPositionSame(wall, checkedWall) &&
        wall.orientation === checkedWall.orientation
      )
    ) {
      throw new DuplicateWallsError();
    }

    checkedWalls.push(wall);
  }

  return true;
}

type AllowedTargetOptions = {
  walls: Wall[];
  pieces: Position[];
  rows: number;
  cols: number;
};

export function getTargets(
  src: Position,
  { walls, pieces, rows, cols }: AllowedTargetOptions,
) {
  const top = { x: src.x, y: 0 };
  const right = { x: cols - 1, y: src.y };
  const bottom = { x: src.x, y: rows - 1 };
  const left = { x: 0, y: src.y };

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
      if (wall.y <= src.y && wall.y > top.y) {
        top.y = wall.y;
      }

      if (wall.y > src.y && wall.y <= bottom.y) {
        bottom.y = wall.y - 1;
      }
    }
  }

  for (const piece of pieces) {
    if (piece.y === src.y) {
      if (piece.x <= src.x && piece.x >= left.x) {
        left.x = piece.x + 1;
      }

      if (piece.x >= src.x && piece.x <= right.x) {
        right.x = piece.x - 1;
      }
    } else if (piece.x === src.x) {
      if (piece.y <= src.y && piece.y >= top.y) {
        top.y = piece.y + 1;
      }

      if (piece.y >= src.y && piece.y <= bottom.y) {
        bottom.y = piece.y - 1;
      }
    }
  }

  return { top, right, bottom, left };
}
