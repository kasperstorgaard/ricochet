import { GameState } from "#/util/game.ts";
import {
  decodeMoves,
  decodePosition,
  encodeMoves,
  encodePosition,
} from "#/util/strings.ts";

export function encodeState({ moves, active, cursor }: GameState) {
  const params = new URLSearchParams();

  if (moves.length) {
    params.set("m", encodeMoves(moves));
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

  const moveParam = params.get("m");
  const moves = moveParam ? decodeMoves(moveParam) : [];

  const activeParam = params.get("a");
  const active = activeParam ? decodePosition(activeParam) : undefined;

  const cursorParam = params.get("c");
  const cursor = cursorParam ? parseInt(cursorParam) : undefined;

  return {
    active,
    cursor: Number.isNaN(cursor) ? 0 : cursor,
    moves,
  };
}
