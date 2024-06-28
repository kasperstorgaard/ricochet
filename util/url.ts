import { join } from "$std/path/join.ts";
import { BoardState, Piece, Wall } from "./board.ts";

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
  return piece.type === "main"
    ? `m${piece.x}_${piece.y}`
    : `b${piece.x}_${piece.y}`;
}

function parsePiece(piece: string): Piece {
  const [, type, x, y] = piece.match(/(m|b)(\d+)_(\d+)/) ?? [];

  return {
    type: type === "m" ? "main" : "bouncer",
    x: parseInt(x),
    y: parseInt(y),
  };
}

export function stringifyBoard(state: BoardState) {
  const wallsPart = state.walls.length
    ? `w:${state.walls.map(stringifyWall).join(",")}`
    : "";
  const piecesPart = state.pieces.length
    ? `p:${state.pieces.map(stringifyPiece), join(",")}`
    : "";

  return [wallsPart, piecesPart].join(",");
}

export function parseBoard(state: string): BoardState {
  const [, walls, pieces] =
    state.match(/(w:(?:[hv]\d+_\d+,?)+)?(p:(?:[mb]\d+_\d+,?)*)?/) ??
      [];

  return {
    walls: walls.slice(2).split(",").map(parseWall),
    pieces: pieces.slice(2).split(",").map(parsePiece),
  };
}
