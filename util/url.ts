import type { Move, Position } from "#/db/types.ts";
import { GameState } from "#/util/game.ts";

const CHAR_CODE_0 = 48;
const CHAR_CODE_9 = 57;
const CHAR_CODE_A = 97;

export function encodeCoordinate(coordinate: number) {
  if (typeof coordinate !== "number") {
    throw new Error("Coordinate must be a number");
  }
  if (coordinate % 1 !== 0) throw new Error("Coordinate must an integer");
  if (coordinate < 0 || coordinate >= 16) {
    throw new Error("Coordinate value must be from 0 to 15");
  }

  return coordinate < 10
    // charcode 48 is "0"
    ? String.fromCharCode((coordinate % 10) + 48)
    // charcode 97 is "a"
    : String.fromCharCode((coordinate % 10) + 97);
}

export function decodeCoordinate(coordinate: string) {
  if (typeof coordinate !== "string") {
    throw new Error("Encoded cordinate must be a string");
  }
  if (coordinate.length !== 1) throw new Error("Encoded coordinate invalid");

  const charCode = coordinate.charCodeAt(0);

  if (charCode > CHAR_CODE_9) return charCode - CHAR_CODE_A + 10;
  return charCode - CHAR_CODE_0;
}

export function encodePosition(position: Position) {
  return encodeCoordinate(position.x) + encodeCoordinate(position.y);
}

export function decodePosition(value: string): Position {
  return {
    x: decodeCoordinate(value[0]),
    y: decodeCoordinate(value[1]),
  };
}

export function encodeMove(move: Move) {
  return encodePosition(move[0]) + encodePosition(move[1]);
}

export function decodeMove(value: string): Move {
  if (value.length !== 4) throw new Error("Invalid move format");

  return [{
    x: decodeCoordinate(value[0]),
    y: decodeCoordinate(value[1]),
  }, {
    x: decodeCoordinate(value[2]),
    y: decodeCoordinate(value[3]),
  }];
}

export function encodeState({ moves, active, cursor }: GameState) {
  const params = new URLSearchParams();

  if (moves.length) {
    params.set("m", moves.map(encodeMove).join(","));
  }

  if (active != null) {
    params.set("a", encodePosition(active));
  }

  if (cursor != null) {
    params.set("c", cursor.toString());
  }

  return params.toString();
}

export function decodeState(urlOrHref: URL | string): GameState {
  // Handle both full URLs and query strings
  const url = new URL(urlOrHref);
  const params = url.searchParams;

  const moves = params.has("m")
    ? params.get("m")!.split(",").map(decodeMove)
    : [];

  const active = params.has("a") ? decodePosition(params.get("a")!) : undefined;

  const cursor = params.has("c") ? parseInt(params.get("c")!) : undefined;

  return {
    active,
    cursor: Number.isNaN(cursor) ? 0 : cursor,
    moves,
  };
}
