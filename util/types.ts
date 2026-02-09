export type Direction = "up" | "right" | "down" | "left";

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

export type Board = {
  destination: Position;
  walls: Wall[];
  pieces: Piece[];
};

export type Move = [Position, Position];

export type Puzzle = {
  slug: string;
  name: string;
  board: Board;
  createdAt: Date;
  description?: string;
  author?: string;
  difficulty?: "easy" | "medium" | "hard";
  isTutorial?: boolean;
};

export type PuzzleManifestEntry = Pick<Puzzle, "slug" | "name" | "createdAt">;

export type PaginationState = {
  page: number;
  totalItems: number;
  totalPages: number;
  itemsPerPage: number;
};

export type PaginatedData<T> = {
  items: T[];
  pagination: PaginationState;
};
