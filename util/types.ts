// Cardinal direction for piece movement
export type Direction = "up" | "right" | "down" | "left";

// A coordinate on the board grid
export type Position = {
  x: number;
  y: number;
};

// A game piece (rook or bouncer) placed on the board
export type Piece = Position & {
  type: "rook" | "bouncer";
};

// A wall segment that blocks piece movement
export type Wall = Position & {
  orientation: "horizontal" | "vertical";
};

// The complete board state with destination, walls, and pieces
export type Board = {
  destination: Position;
  walls: Wall[];
  pieces: Piece[];
};

// A move represented as a pair of positions [from, to]
export type Move = [Position, Position];

// A complete puzzle with metadata and board configuration
export type Puzzle = {
  slug: string;
  name: string;
  board: Board;
  createdAt: Date;
  difficulty?: number;
};

// Lightweight puzzle entry used in the manifest index
export type PuzzleManifestEntry = Pick<Puzzle, "slug" | "name" | "createdAt">;

// Tracks current pagination position and total counts
export type PaginationState = {
  page: number;
  totalItems: number;
  totalPages: number;
  itemsPerPage: number;
};

// A paginated response containing items and pagination metadata
export type PaginatedData<T> = {
  items: T[];
  pagination: PaginationState;
};
