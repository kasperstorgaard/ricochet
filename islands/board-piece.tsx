import { cn } from "../lib/style.ts";
import { type Direction, useFlick } from "../lib/touch.ts";

type Props = {
  href: string;
  x: number;
  y: number;
  type: "rook" | "bouncer";
  isActive?: boolean;
  onFlick: (direction: Direction) => void;
  onActivate: () => void;
};

export function BoardPiece(
  { href, isActive, x, y, type, onActivate, onFlick }: Props,
) {
  const { ref } = useFlick<HTMLAnchorElement>({ onFlick });

  return (
    <a
      ref={ref}
      href={href}
      className={cn(
        "flex place-content-center col-start-1 row-start-1 p-[var(--pad)] w-full aspect-square place-self-center",
        "translate-x-[calc((var(--space-w)+var(--gap))*var(--piece-x))]",
        "translate-y-[calc((var(--space-w)+var(--gap))*var(--piece-y))]",
        "transition-transform duration-200 ease-out",
        x > 0 && "-ml-[1px]",
        y > 0 && "-mt-[1px]",
      )}
      autoFocus={isActive}
      style={{
        "--piece-x": x,
        "--piece-y": y,
        "--pad": "var(--size-2)",
      }}
      onFocus={() => onActivate()}
      onClick={(event) => {
        event.preventDefault();
        onActivate();
      }}
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
