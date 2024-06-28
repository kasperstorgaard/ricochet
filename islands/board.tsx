import type { Signal } from "@preact/signals";
import { useCallback, useMemo } from "preact/hooks";

import { cn } from "../lib/style.ts";
import { getDestinations, isPositionSame, Wall } from "../util/board.ts";

type Position = {
  x: number;
  y: number;
};

interface GridProps {
  active: Signal<Position | null>;
  walls: Signal<Wall[]>;
  cols: number;
  rows: number;
}

export default function Board(
  { active, walls, cols, rows }: GridProps,
) {
  const config = { cols, rows };

  const spaces: Position[][] = [];
  const destinations = useMemo(
    () =>
      active.value
        ? getDestinations(active.value, { ...config, walls: walls.value })
        : null,
    [active.value],
  );

  for (let y = 0; y < rows; y++) {
    spaces[y] = [];

    for (let x = 0; x < cols; x++) {
      spaces[y].push({ x, y });
    }
  }

  return (
    <div
      className="grid gap-1 max-w-sm w-full border-t-1 border-l-1 border-gray-7 rounded-2"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {/* Drawing the spaces */}
      {spaces.map((row) =>
        row.map((space) => (
          <div
            key={`${space.x}-${space.y}`}
            className={cn(
              "grid place-content-center items-center content-center border-b-1 border-r-1 border-gray-7 aspect-square rounded-1",
            )}
            style={{
              gridColumn: `${space.x + 1}`,
              gridRow: `${space.y + 1}`,
            }}
          />
        ))
      )}

      {/* If we have an active space/piece, draw the possible destinations  */}
      {destinations && (
        <>
          {/* Backgrounds between src and destinations */}
          <div
            className="bg-blue-3 opacity-10 pointer-events-none"
            style={{
              gridColumnStart: destinations.top.x + 1,
              gridRowStart: destinations.top.y + 1,
              gridRowEnd: destinations.bottom.y + 2,
            }}
          />

          {/* shader showing the way to destinations */}
          <div
            className="bg-blue-3 opacity-10 pointer-events-none"
            style={{
              gridColumnStart: destinations.left.x + 1,
              gridColumnEnd: destinations.right.x + 2,
              gridRowStart: destinations.left.y + 1,
            }}
          />

          {destinations.top.y !== active.value?.y && (
            <div
              className="m-2 border-2 border-blue-3 opacity-10 rounded-round"
              style={{
                gridColumnStart: destinations.top.x + 1,
                gridRowStart: destinations.top.y + 1,
              }}
              onClick={() => active.value = destinations.top}
            />
          )}

          {destinations.bottom.y !== active.value?.y && (
            <div
              className="m-2 border-2 border-blue-3 opacity-10 rounded-round"
              style={{
                gridColumnStart: destinations.bottom.x + 1,
                gridRowStart: destinations.bottom.y + 1,
              }}
              onClick={() => active.value = destinations.bottom}
            />
          )}

          {destinations.left.x !== active.value?.x && (
            <div
              className="m-2 border-2 border-blue-3 opacity-10 rounded-round"
              style={{
                gridColumnStart: destinations.left.x + 1,
                gridRowStart: destinations.left.y + 1,
              }}
              onClick={() => active.value = destinations.left}
            />
          )}

          {destinations.right.x !== active.value?.x && (
            <div
              className="m-2 border-2 border-blue-3 opacity-10 rounded-round"
              style={{
                gridColumnStart: destinations.right.x + 1,
                gridRowStart: destinations.right.y + 1,
              }}
              onClick={() => active.value = destinations.right}
            />
          )}
        </>
      )}

      {walls.value.map((wall) => (
        <span
          className={cn(
            "place-self-start border-orange-5",
            wall.orientation === "vertical"
              ? "h-full border-r-2 -ml-[5px]"
              : "w-full border-t-2 -mt-[5px]",
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
