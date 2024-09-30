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

export class BoardError extends Error {
  constructor() {
    super("Board is invalid");
  }
}

export type BoardLike = {
  cols: number | null | undefined;
  rows: number | null | undefined;
  destination: Position | null | undefined;
  walls: (Wall | null | undefined)[] | undefined | null;
  pieces: (Piece | null | undefined)[] | undefined | null;
};

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

export function validateBoard(board: BoardLike): BoardState {
  if (!board) throw new BoardError();

  const { cols, rows, destination, pieces, walls } = board;
  if (!pieces?.length) throw new BoardError();

  if (cols == null || cols === 0) throw new BoardError();
  if (rows == null || rows === 0) throw new BoardError();

  if (!destination) throw new BoardError();

  if (isPositionOutOfBounds(destination, { cols, rows })) {
    throw new BoardError();
  }

  const checkedPieces: Piece[] = [];
  for (const piece of pieces) {
    if (piece == null || !piece.type || piece.x == null || piece.y == null) {
      throw new BoardError();
    }

    if (isPositionOutOfBounds(piece, { cols, rows })) {
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
    if (isPositionOutOfBounds(wall, { cols, rows })) {
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
    cols,
    rows,
    destination,
    pieces: checkedPieces,
    walls: checkedWalls,
  };
}

export type Targets = {
  top?: Position;
  right?: Position;
  bottom?: Position;
  left?: Position;
};

export function getTargets(
  src: Position,
  { walls, pieces, rows, cols }: Pick<
    BoardState,
    "cols" | "rows" | "pieces" | "walls"
  >,
): Targets {
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
    if (piece.y === src.y && piece.x === src.x) continue;

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

  // Check for overlaps, and only add targets where not found
  const lookup: Targets = {};
  for (const [key, target] of Object.entries({ top, right, bottom, left })) {
    const hasOverlap = pieces.some((piece) => isPositionSame(piece, target));

    if (!hasOverlap) {
      lookup[key as keyof Targets] = target;
    }
  }

  return lookup;
}

export function isValidMove(
  src: Position,
  target: Position,
  board: Pick<BoardState, "cols" | "rows" | "pieces" | "walls">,
) {
  const matchingPiece = board.pieces.find((piece) =>
    isPositionSame(piece, src)
  );

  if (!matchingPiece) return false;

  const targets = getTargets(src, board);

  for (const possibleTarget of Object.values(targets)) {
    if (isPositionSame(possibleTarget, target)) return true;
  }

  return false;
}

export function isGameWon(board: Pick<BoardState, "destination" | "pieces">) {
  for (const piece of board.pieces) {
    if (piece.type === "bouncer") continue;

    if (isPositionSame(piece, board.destination)) return true;
  }

  return false;
}
