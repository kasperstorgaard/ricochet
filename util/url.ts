import { join } from "$std/path/join.ts";
import { BoardState, Piece, Position, Wall } from "./board.ts";

function stringifyPosition(position: Position) {
  return `${position.x}_${position.y}`;
}

function parsePosition(position: string): Position {
  const [, x, y] = position.match(/(\d+)_(\d+)/) ?? [];

  return {
    x: parseInt(x),
    y: parseInt(y),
  };
}

function stringifyWall(wall: Wall) {
  return wall.orientation === "horizontal"
    ? `h${wall.x}_${wall.y}`
    : `w${wall.x}_${wall.y}`;
}

function parseWall(wall: string): Wall {
  const [, orientation, x, y] = wall.match(/(h|v)(\d+)_(\d+)/) ?? [];

  return {
    orientation: orientation === "h" ? "horizontal" : "vertical",
    x: parseInt(x),
    y: parseInt(y),
  };
}

function stringifyPiece(piece: Piece) {
  return piece.type === "rook"
    ? `m${piece.x}_${piece.y}`
    : `b${piece.x}_${piece.y}`;
}

function parsePiece(piece: string): Piece {
  const [, type, x, y] = piece.match(/(m|b)(\d+)_(\d+)/) ?? [];

  return {
    type: type === "r" ? "rook" : "bouncer",
    x: parseInt(x),
    y: parseInt(y),
  };
}

export function stringifyBoard(state: BoardState) {
  const colsPart = `c:${state.cols}`;
  const rowsPart = `r:${state.cols}`;
  const destinationPart = `d:${stringifyPosition(state.destination)}`;

  const wallsPart = state.walls.length
    ? `w:${state.walls.map(stringifyWall).join(",")}`
    : "";
  const piecesPart = state.pieces.length
    ? `p:${state.pieces.map(stringifyPiece), join(",")}`
    : "";

  return [colsPart, rowsPart, destinationPart, wallsPart, piecesPart].join(",");
}

export function parseBoard(state: string | null | undefined): BoardState {
  if (state == null || state.length === 0) {
    throw new Error("Board is empty");
  }

  const [, colStr, rowStr, destinationStr, wallsStr, piecesStr] = state.match(
    /(c:\d+)(r:\d+)(d:(\d+_\d+))(w:([hv]\d+_\d+,?)+)?(?:p:([rb]\d+_\d+,?)*)?/,
  ) ??
    [];

  return {
    cols: parseInt(colStr.slice(2)),
    rows: parseInt(rowStr.slice(2)),
    destination: parsePosition(destinationStr.slice(2)),
    walls: wallsStr.split(",").map(parseWall),
    pieces: piecesStr.split(",").map(parsePiece),
  };
}
