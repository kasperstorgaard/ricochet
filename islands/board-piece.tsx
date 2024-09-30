import { Position } from "../util/board.ts";
import { cn } from "../lib/style.ts";
import { useCallback, useRef } from "preact/hooks";

type Props = {
  href: string;
  x: number;
  y: number;
  type: "rook" | "bouncer";
  isActive?: boolean;
  onFlick: (
    position: Position,
    direction: "up" | "right" | "down" | "left",
  ) => void;
  onActivate: (position: Position) => void;
};

export function BoardPiece(
  { href, x, y, type, isActive, onFlick, onActivate }: Props,
) {
  const ref = useRef<HTMLAnchorElement>(null);

  const onTouchStart = useCallback((startEvent: TouchEvent) => {
    let prevX = 0;
    let prevY = 0;
    let currentX = startEvent.touches[0].clientX;
    let currentY = startEvent.touches[0].clientY;
    let lastTime = startEvent.timeStamp;

    const onTouchMove = (moveEvent: Event) => {
      lastTime = moveEvent.timeStamp;
      prevX = currentX;
      prevY = currentY;
      currentX = (moveEvent as TouchEvent).touches[0].clientX;
      currentY = (moveEvent as TouchEvent).touches[0].clientY;
    };

    const onTouchEnd = (endEvent: Event) => {
      ref.current?.removeEventListener("touchend", onTouchEnd);
      ref.current?.removeEventListener("touchmove", onTouchMove);

      const timeDelta = endEvent.timeStamp - lastTime;

      const xDiff = prevX - currentX;
      const yDiff = prevY - currentY;
      const xDelta = Math.abs(xDiff);
      const yDelta = Math.abs(yDiff);

      let direction: null | "up" | "right" | "down" | "left" = null;
      if (xDelta > yDelta && xDelta / timeDelta > 1) {
        direction = xDiff < 0 ? "right" : "left";
      } else if (yDelta / timeDelta > 1) {
        direction = yDiff < 0 ? "down" : "up";
      }

      if (direction) {
        onFlick({ x, y }, direction);
      } else {
        onActivate({ x, y });
      }
    };

    const kill = () => {
      ref.current?.removeEventListener("touchmove", onTouchMove);
      ref.current?.removeEventListener("touchend", onTouchEnd);
      ref.current?.removeEventListener("touchcancel", kill);
    };

    ref.current?.addEventListener("touchmove", onTouchMove);
    ref.current?.addEventListener("touchend", onTouchEnd);
    ref.current?.addEventListener("touchcancel", kill);

    return kill;
  }, [onActivate, onFlick]);

  return (
    <a
      ref={ref}
      href={href}
      className={cn(
        "flex place-content-center col-start-1 row-start-1 p-[var(--pad)] w-full aspect-square place-self-center",
        "translate-x-[calc((var(--space-w)+var(--gap))*var(--piece-x))]",
        "translate-y-[calc((var(--space-w)+var(--gap))*var(--piece-y))]",
        "transition-transform duration-100 ease-out",
        x > 0 && "-ml-[1px]",
        y > 0 && "-mt-[1px]",
      )}
      autoFocus={isActive}
      style={{
        "--piece-x": x,
        "--piece-y": y,
        "--pad": "var(--size-2)",
      }}
      onFocus={() => onActivate({ x, y })}
      onClick={(event) => {
        event.preventDefault();
        onActivate({ x, y });
      }}
      onTouchStart={onTouchStart}
    >
      <div
        className={cn(
          "w-full",
          type === "rook" && "bg-yellow-3 rounded-round",
          type === "bouncer" && "bg-cyan-7 rounded-2",
        )}
      />
    </a>
  );
}
