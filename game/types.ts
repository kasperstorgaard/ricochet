// Cardinal direction for piece movement
export type Direction = "up" | "right" | "down" | "left";

// A coordinate on the board grid
export type Position = {
  x: number;
  y: number;
};

// A game piece (puck or blocker) placed on the board
export type Piece = Position & {
  type: "puck" | "blocker";
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

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type Difficulty = typeof DIFFICULTIES[number];

export type Onboarding = "new" | "started" | "done";

// The full game state encoded in the URL, including move history and UI state
export type GameState = {
  moves: Move[]; // List of moves made so far
  active?: Position; // Currently selected piece (if any)
  cursor?: number; // Index in the moves array for undo/redo functionality
  hint?: Move; // Optional hint move to display
};

// A move represented as a pair of positions [from, to]
export type Move = [Position, Position];

// A complete puzzle with metadata and board configuration
export type Puzzle = {
  number: number;
  slug: string;
  name: string;
  board: Board;
  createdAt: Date;
  difficulty: Difficulty;
  minMoves: number;
};

// Lightweight puzzle entry used in the manifest index
export type PuzzleManifestEntry = Pick<
  Puzzle,
  "number" | "slug" | "name" | "createdAt" | "minMoves" | "difficulty"
>;

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
