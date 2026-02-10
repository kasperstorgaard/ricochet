import { useCallback } from "preact/hooks";
import type { RefObject } from "preact";
import type { Direction, Piece, Position } from "#/util/types.ts";
import { useArrowKeys } from "#/lib/keyboard.ts";
import { useSwipe } from "#/lib/touch.ts";

const DEFAULT_VELOCITY = 1; // px/ms

export type OnMove = (
  src: Position,
  opts: { direction: Direction; cellSize: number; velocity: number },
) => void;

type UseMoveOptions = {
  pieces: Piece[];
  active?: Position;
  onMove: OnMove;
  isEnabled: boolean;
};

/**
 * Unified input hook for piece movement.
 * Wires up keyboard (arrow keys) and touch (swipe) to a single onMove callback.
 */
export function useMove(
  swipeRegionRef: RefObject<HTMLElement>,
  boardRef: RefObject<HTMLElement>,
  { pieces, active, onMove, isEnabled }: UseMoveOptions,
): void {
  const onArrowKey = useCallback(
    (direction: Direction) => {
      if (!active) return;

      const boardWidth = boardRef.current?.getBoundingClientRect().width ?? 0;
      const cellSize = boardWidth / 8;
      onMove(active, { direction, cellSize, velocity: DEFAULT_VELOCITY });
    },
    [active, onMove, boardRef],
  );

  useArrowKeys({ onArrowKey, isEnabled });

  useSwipe(swipeRegionRef, boardRef, {
    pieces,
    onSwipe: onMove,
    isEnabled,
  });
}
