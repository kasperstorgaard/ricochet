import {
  decodeMove,
  decodeMoves,
  decodePosition,
  encodeMove,
  encodeMoves,
  encodePosition,
} from "#/util/strings.ts";
import { Move, Position } from "./types.ts";

/**
 * All state needed to represent the current game
 */
export type GameState = {
  // What moves have been made
  moves: Move[];
  // What position is currently active/selected, if any
  active?: Position;
  // Current position in the move list (for undo/redo)
  // note: this allows for perfect undo/redo, as no state is lost.
  cursor?: number;
  // Optional hint move to show on the board
  hint?: Move;
};

/**
 * Encodes all the game state into URL parameters
 * @param state
 * @returns search params string
 */
export function encodeState({ moves, active, cursor, hint }: GameState) {
  const params = new URLSearchParams();

  if (moves.length) {
    params.set("moves", encodeMoves(moves));
  }

  if (active != null) {
    params.set("active", encodePosition(active));
  }

  if (cursor != null) {
    params.set("cursor", cursor.toString());
  }

  if (hint != null) {
    params.set("hint", encodeMove(hint));
  }

  return params.toString();
}

/**
 * Decodes the game state from URL parameters
 * @param urlOrHref
 * @returns Game state
 */
export function decodeState(urlOrHref: URL | string): GameState {
  // Handle both full URLs and query strings
  const url = new URL(urlOrHref);
  const params = url.searchParams;

  const moveParam = params.get("moves");
  const moves = moveParam ? decodeMoves(moveParam) : [];

  const activeParam = params.get("active");
  const active = activeParam ? decodePosition(activeParam) : undefined;

  const cursorParam = params.get("cursor");
  const cursor = cursorParam ? parseInt(cursorParam) : undefined;

  const hintParam = params.get("hint");
  const hint = hintParam ? decodeMove(hintParam) : undefined;

  return {
    active,
    cursor: Number.isNaN(cursor) ? 0 : cursor,
    moves,
    hint,
  };
}

type GetMoveOptions = GameState & {
  href: string;
};

/**
 * @param move
 * @param param1
 * @returns
 */
export function getMovesHref(
  newMoves: Move[],
  { href, moves, cursor }: GetMoveOptions,
) {
  const updatedMoves = [...moves.slice(0, cursor ?? moves.length), ...newMoves];
  const url = new URL(href);

  url.search = encodeState({
    moves: updatedMoves,
    cursor: updatedMoves.length,
    active: newMoves[newMoves.length - 1][1],
  });

  return url.href;
}

type GetActiveHrefOptions = GameState & { href: string };

export function getActiveHref(
  active: Position,
  { href, hint: _, ...state }: GetActiveHrefOptions,
) {
  const url = new URL(href);

  url.search = encodeState({
    ...state,
    active,
  });

  return url.href;
}

export function getUndoHref(
  href: string,
  { hint: _, ...state }: GameState,
) {
  const url = new URL(href);
  const cursor = state.cursor != null
    ? Math.max(state.cursor - 1, 0)
    : state.moves.length - 2;

  url.search = encodeState({
    ...state,
    cursor,
  });

  return url.href;
}

export function getRedoHref(
  href: string,
  { hint: _, ...state }: GameState,
) {
  const url = new URL(href);
  const cursor = state.cursor != null
    ? Math.min(state.cursor + 1, state.moves.length)
    : state.moves.length;

  url.search = encodeState({
    ...state,
    cursor,
  });

  return url.href;
}

export function getResetHref(href: string) {
  const url = new URL(href);

  url.searchParams.delete("active");
  url.searchParams.delete("cursor");
  url.searchParams.delete("moves");
  url.searchParams.delete("hint");

  return url.href;
}

export function getPage(
  url: URL,
) {
  const pageParam = url.searchParams.get("page");

  if (!pageParam) return 1;

  const parsed = Number.parseInt(pageParam, 10);
  return Number.isNaN(parsed) ? 1 : parsed;
}
