import { useCallback, useEffect, useRef } from "preact/hooks";

export type Direction = "up" | "right" | "down" | "left";

type Props = {
  onFlick: (direction: Direction) => void;
  isEnabled?: boolean;
};

/**
 * Minimum speed in pixels per millisecond to trigger a flick.
 * example: 400 pixels in 100ms = 4.0 speed
 */
const SPEED_THRESHOLD = 0.25;

export function useFlick<TElement extends HTMLElement = HTMLElement>(
  { onFlick, isEnabled }: Props,
) {
  const ref = useRef<TElement>(null);

  const onTouchStart = useCallback((startEvent: TouchEvent) => {
    const startX = startEvent.touches[0].clientX;
    const startY = startEvent.touches[0].clientY;
    let currentX = startX;
    let currentY = startY;

    const onTouchMove = (moveEvent: Event) => {
      currentX = (moveEvent as TouchEvent).touches[0].clientX;
      currentY = (moveEvent as TouchEvent).touches[0].clientY;
    };

    const kill = () => {
      ref.current?.removeEventListener("touchmove", onTouchMove);
      ref.current?.removeEventListener("touchend", onTouchEnd);
      ref.current?.removeEventListener("touchcancel", kill);
      ref.current?.removeEventListener("click", kill);
    };

    const onTouchEnd = (endEvent: Event) => {
      kill();

      const xMovement = startX - currentX;
      const yMovement = startY - currentY;
      const xDelta = Math.abs(xMovement);
      const yDelta = Math.abs(yMovement);
      const timeDelta = endEvent.timeStamp - startEvent.timeStamp;

      const maxDistance = Math.max(xDelta, yDelta);
      const speed = maxDistance / timeDelta;
      if (speed < SPEED_THRESHOLD) return;

      let direction: "up" | "right" | "down" | "left";

      if (xDelta > yDelta) {
        direction = xMovement < 0 ? "right" : "left";
      } else {
        direction = yMovement < 0 ? "down" : "up";
      }

      onFlick(direction);
    };

    if (isEnabled) {
      ref.current?.addEventListener("touchcancel", kill);
      // ref.current?.addEventListener("click", kill);
      ref.current?.addEventListener("touchmove", onTouchMove, {
        passive: true,
      });
      ref.current?.addEventListener("touchend", onTouchEnd, { passive: true });
    }

    return kill;
  }, [isEnabled, onFlick]);

  useEffect(() => {
    if (isEnabled) {
      ref.current?.addEventListener("touchstart", onTouchStart, {
        passive: true,
      });
    }

    return () => {
      ref.current?.removeEventListener("touchstart", onTouchStart);
    };
  }, [ref.current, isEnabled, onTouchStart]);

  return {
    ref,
  };
}
