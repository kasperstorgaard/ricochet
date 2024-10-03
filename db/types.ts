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
  id: string;
  name: string;
  board: Board;
};

export type Solution = {
  id: string;
  puzzleId: string;
  name: string;
  moves: Move[];
};
