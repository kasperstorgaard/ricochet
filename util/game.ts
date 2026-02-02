import { useEffect } from "preact/hooks";

import { Move, Position } from "#/util/types.ts";
import { encodeState } from "#/util/url.ts";

export type GameState = {
  moves: Move[];
  active?: Position;
  cursor?: number;
};

type GetMoveOptions = GameState & {
  href: string;
};

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

type useGameShortcutsOptions = {
  onSubmit?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onReset?: () => void;
};

export function useGameShortcuts(
  { onSubmit, onUndo, onRedo, onReset }: useGameShortcutsOptions,
) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      // If the event originated from an input, let it do it's thing.
      const input = (event.target as HTMLElement).closest("input");
      if (input != null) return;

      switch (event.key) {
        case "Enter":
          return onSubmit?.();
        case "u":
          return onUndo?.();
        case "U":
          return onReset?.();
        case "r":
          return onRedo?.();
      }
    };

    self.addEventListener("keyup", handler);

    return () => {
      self.removeEventListener("keyup", handler);
    };
  }, [onSubmit, onUndo, onRedo, onReset]);
}
