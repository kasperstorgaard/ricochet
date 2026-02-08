import { useEffect, useRef } from "preact/hooks";
import type { RefObject } from "preact";
import type { Piece, Position } from "#/util/types.ts";

export type Direction = "up" | "right" | "down" | "left";

type UseSwipeOptions = {
  pieces: Piece[];
  onSwipe: (piece: Position, direction: Direction) => void;
  isEnabled?: boolean;
};

/** Maximum distance (in grid cells) from touch point to match a piece. */
const PROXIMITY_RADIUS = 0.6;

/**
 * Converts a ZingTouch angle (unit circle degrees) to a cardinal direction.
 *
 * ZingTouch: 0°=right, 90°=up, 180°=left, 270°=down.
 * Quadrants: 315-45°→right, 45-135°→up, 135-225°→left, 225-315°→down.
 */
function angleToDirection(angleDeg: number): Direction {
  const a = ((angleDeg % 360) + 360) % 360;
  if (a >= 315 || a < 45) return "right";
  if (a >= 45 && a < 135) return "up";
  if (a >= 135 && a < 225) return "left";
  return "down";
}

/**
 * Given a touch point on the board, find the nearest piece within the proximity radius.
 * Returns the piece's position or null.
 */
function findNearestPiece(
  touchX: number,
  touchY: number,
  boardRect: DOMRect,
  pieces: Piece[],
): Position | null {
  const cellSize = boardRect.width / 8;

  // Convert touch coordinates to grid position (0-7 fractional)
  const gridX = (touchX - boardRect.left) / cellSize;
  const gridY = (touchY - boardRect.top) / cellSize;

  let closest: Piece | null = null;
  let closestDist = Infinity;

  for (const piece of pieces) {
    // Piece center is at (piece.x + 0.5, piece.y + 0.5) in grid space
    const dx = gridX - (piece.x + 0.5);
    const dy = gridY - (piece.y + 0.5);
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < closestDist && dist <= PROXIMITY_RADIUS) {
      closest = piece;
      closestDist = dist;
    }
  }

  return closest;
}

/**
 * Board-level swipe detection using ZingTouch.
 * Attaches a single swipe listener to the board container.
 * On touchstart, finds the nearest piece via proximity detection.
 * On swipe, converts angle to direction and calls onSwipe.
 *
 * Mobile only — skips initialization on non-touch devices.
 */
export function useSwipe(
  boardRef: RefObject<HTMLElement>,
  { pieces, onSwipe, isEnabled }: UseSwipeOptions,
): void {
  // Use refs for values that change frequently to avoid re-creating the region
  const piecesRef = useRef(pieces);
  piecesRef.current = pieces;

  const onSwipeRef = useRef(onSwipe);
  onSwipeRef.current = onSwipe;

  useEffect(() => {
    const boardEl = boardRef.current;
    if (!boardEl || !isEnabled) return;
    if (!("ontouchstart" in window)) return;

    let touchedPiece: Position | null = null;
    // deno-lint-ignore no-explicit-any
    let region: any = null;
    let destroyed = false;

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      const boardRect = boardEl.getBoundingClientRect();
      touchedPiece = findNearestPiece(
        touch.clientX,
        touch.clientY,
        boardRect,
        piecesRef.current,
      );
    };

    boardEl.addEventListener("touchstart", onTouchStart, { passive: true });

    // Dynamic import to avoid SSR issues
    import("zingtouch").then((ZingTouch) => {
      if (destroyed) return;

      const ZT = ZingTouch.default ?? ZingTouch;
      region = new ZT.Region(boardEl, false, false);

      const swipe = new ZT.Swipe({
        escapeVelocity: 0.25,
        maxRestTime: 100,
      });

      // deno-lint-ignore no-explicit-any
      region.bind(boardEl, swipe, (event: any) => {
        if (!touchedPiece) return;

        const data = event.detail.data[0];
        if (!data) return;

        const direction = angleToDirection(data.currentDirection);
        onSwipeRef.current(touchedPiece, direction);
        touchedPiece = null;
      });
    });

    return () => {
      destroyed = true;
      boardEl.removeEventListener("touchstart", onTouchStart);
      if (region) {
        region.unbind(boardEl);
      }
    };
  }, [boardRef.current, isEnabled]);
}
