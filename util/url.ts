import { BoardState, Piece, Position, validateBoard, Wall } from "./board.ts";

export function stringifyPosition(position: Position) {
  return `${position.x}_${position.y}`;
}

export function parsePosition(position: string | null): Position | null {
  if (position == null || position === "") return null;

  const [, x, y] = position.match(/(\d+)_(\d+)/) ?? [];

  if (x == null || x === "" || y == null || y === "") return null;

  return {
    x: parseInt(x),
    y: parseInt(y),
  };
}

function stringifyWall(wall: Wall) {
  return wall.orientation === "horizontal"
    ? `h${wall.x}_${wall.y}`
    : `v${wall.x}_${wall.y}`;
}

function parseWall(wall: string): Wall | null {
  const [, orientation, x, y] = wall.match(/(h|v)(\d+)_(\d+)/) ?? [];

  if (!orientation || x == null || y == null) return null;

  return {
    orientation: orientation === "h" ? "horizontal" : "vertical",
    x: parseInt(x),
    y: parseInt(y),
  };
}

function stringifyPiece(piece: Piece) {
  return piece.type === "rook"
    ? `r${piece.x}_${piece.y}`
    : `b${piece.x}_${piece.y}`;
}

function parsePiece(piece: string): Piece | null {
  const [, type, x, y] = piece.match(/(r|b)(\d+)_(\d+)/) ?? [];

  if (
    type == null ||
    type === "" ||
    x == null ||
    x === "" ||
    y == null ||
    y === ""
  ) {
    return null;
  }

  return {
    type: type === "r" ? "rook" : "bouncer",
    x: parseInt(x),
    y: parseInt(y),
  };
}

export function stringifyBoard(state: BoardState) {
  const params = new URLSearchParams();

  params.set("d", stringifyPosition(state.destination));

  params.set("p", state.pieces.map(stringifyPiece).join("+"));

  if (state.walls.length) {
    params.set("w", state.walls.map(stringifyWall).join("+"));
  }

  return params.toString();
}

export function parseBoard(value: string | null | undefined): BoardState {
  if (!value) throw new Error("Invalid board params string");

  const params = new URLSearchParams(value);

  const destination = params.has("d")
    ? parsePosition(params.get("d") ?? "")
    : null;
  const pieces = params.has("p")
    ? (params.get("p")?.split("+") ?? []).map(parsePiece)
    : [];

  const walls = params.has("w")
    ? (params.get("w")?.split("+") ?? []).map(parseWall)
    : [];

  const board = validateBoard({ destination, pieces, walls });
  return board;
}
