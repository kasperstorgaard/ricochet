import type { Signal } from "@preact/signals";

import { cn } from "../lib/style.ts";
import { getDestinations, Wall } from "../util/board.ts";

type Position = {
  x: number;
  y: number;
};

interface GridProps {
  active?: Signal<Position>;
  walls: Signal<Wall[]>;
  cols: number;
  rows: number;
}

export default function Board({ active, walls, cols, rows }: GridProps) {
  const config = { cols, rows };

  const spaces: Position[][] = [];
  const destinations = active
    ? getDestinations(active.value, { ...config, walls: walls.value })
    : null;

  console.log({ destinations });

  for (let y = 0; y < rows; y++) {
    spaces[y] = [];

    for (let x = 0; x < cols; x++) {
      spaces[y].push({ x, y });
    }
  }

  return (
    <div
      className="text-00 grid gap-1 max-w-sm w-full border-t-1 border-l-1 border-gray-7 rounded-2"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {spaces.map((row) =>
        row.map((space) => (
          <div
            key={`${space.x}-${space.y}`}
            className={cn(
              "grid place-content-center items-center content-center border-b-1 border-r-1 border-gray-7 aspect-square shadow-in-0 rounded-1",
            )}
            style={{
              gridColumn: `${space.x + 1}`,
              gridRow: `${space.y + 1}`,
            }}
          >
            {space.x}/{space.y}
          </div>
        ))
      )}

      {destinations && (
        <>
          <div
            className="bg-blue-3 opacity-15"
            style={{
              gridColumnStart: destinations.top.x + 1,
              gridRowStart: destinations.top.y + 1,
              gridRowEnd: destinations.bottom.y + 2,
            }}
          />
          <div
            className="bg-blue-3 opacity-15"
            style={{
              gridColumnStart: destinations.left.x + 1,
              gridColumnEnd: destinations.right.x + 2,
              gridRowStart: destinations.left.y + 1,
            }}
          />
        </>
      )}

      {walls.value.map((wall) => (
        <span
          className={cn(
            "place-self-start border-yellow-3",
            wall.orientation === "vertical"
              ? "h-full border-r-1"
              : "w-full border-b-1",
          )}
          style={{
            gridColumn: wall.x + 1,
            gridRow: wall.y + 1,
          }}
        />
      ))}

      {/* TODO: draw pieces */}
    </div>
  );
}
