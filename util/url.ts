import {
  decodeMoves,
  decodePosition,
  encodeMoves,
  encodePosition,
} from "#/util/strings.ts";
import { page } from "fresh";
import { Move, PaginatedData, Position } from "./types.ts";
import { stat } from "node:fs";

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
};

/**
 * Encodes all the game state into URL parameters
 * @param state
 * @returns search params string
 */
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

/**
 * Decodes the game state from URL parameters
 * @param urlOrHref
 * @returns Game state
 */
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

type GetMoveOptions = GameState & {
  href: string;
};

/**
 * @param move
 * @param param1
 * @returns
 */
export function getMoveHref(
  move: Move,
  { href, moves, cursor }: GetMoveOptions,
) {
  const updatedMoves = [...moves.slice(0, cursor ?? moves.length), move];
  const url = new URL(href);

  url.search = encodeState({
    moves: updatedMoves,
    cursor: updatedMoves.length,
    active: move[1],
  });

  return url.href;
}

type GetActiveHrefOptions = GameState & { href: string };

export function getActiveHref(
  active: Position,
  { href, ...state }: GetActiveHrefOptions,
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
  state: GameState,
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
  state: GameState,
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

  url.searchParams.delete("a");
  url.searchParams.delete("c");
  url.searchParams.delete("m");

  return url.href;
}

export function getPage(
  url: URL,
) {
  const pageParam = url.searchParams.get("p");

  if (!pageParam) return 1;

  const parsed = Number.parseInt(pageParam, 10);
  return Number.isNaN(parsed) ? 1 : parsed;
}
