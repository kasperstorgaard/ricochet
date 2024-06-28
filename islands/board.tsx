import type { Signal } from "@preact/signals";
import { useCallback, useMemo, useState } from "preact/hooks";

import { cn } from "../lib/style.ts";
import {
  getTargets,
  isPositionSame,
  Piece,
  Position,
  Wall,
} from "../util/board.ts";

interface GridProps {
  pieces: Signal<Piece[]>;
  walls: Signal<Wall[]>;
  cols: number;
  rows: number;
}

export default function Board(
  { pieces, walls, cols, rows }: GridProps,
) {
  const config = { cols, rows };

  const [active, setActive] = useState<Position | null>(null);

  const nonActivePieces = useMemo(
    () =>
      active
        ? pieces.value.filter((piece) => !isPositionSame(piece, active))
        : pieces.value,
    [pieces.value, active],
  );

  const targets = useMemo(
    () =>
      active
        ? getTargets(active, {
          ...config,
          walls: walls.value,
          pieces: nonActivePieces,
        })
        : null,
    [active],
  );

  const spaces = useMemo(() => {
    const positions: Position[][] = [];

    for (let y = 0; y < rows; y++) {
      positions[y] = [];

      for (let x = 0; x < cols; x++) {
        positions[y].push({ x, y });
      }
    }

    return positions;
  }, []);

  const movePiece = useCallback((position: Position) => {
    if (!active) return;

    pieces.value = pieces.value.map((piece) =>
      isPositionSame(piece, active)
        ? {
          ...piece,
          ...position,
        }
        : piece
    );

    setActive(position);
  }, [active, pieces.value]);

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
              "grid border-b-1 border-r-1 border-gray-7 aspect-square rounded-1",
            )}
            style={{
              gridColumn: `${space.x + 1}`,
              gridRow: `${space.y + 1}`,
            }}
          />
        ))
      )}

      {/* If we have an active space/piece, draw the possible destinations  */}
      {targets && (
        <>
          {/* Backgrounds between src and destinations */}
          <div
            className="bg-blue-3 opacity-10 pointer-events-none"
            style={{
              gridColumnStart: targets.top.x + 1,
              gridRowStart: targets.top.y + 1,
              gridRowEnd: targets.bottom.y + 2,
            }}
          />

          {/* shader showing the way to destinations */}
          <div
            className="bg-blue-3 opacity-10 pointer-events-none"
            style={{
              gridColumnStart: targets.left.x + 1,
              gridColumnEnd: targets.right.x + 2,
              gridRowStart: targets.left.y + 1,
            }}
          />

          {targets.top.y !== active?.y && (
            <div
              className="w-[80%] aspect-square -ml-1 -mt-1 border-2 border-blue-3 opacity-10 rounded-round place-self-center"
              style={{
                gridColumnStart: targets.top.x + 1,
                gridRowStart: targets.top.y + 1,
              }}
              // TODO: move
              onClick={() => movePiece(targets.top)}
            />
          )}

          {targets.bottom.y !== active?.y && (
            <div
              className="w-[80%] aspect-square -ml-1 -mt-1 border-2 border-blue-3 opacity-10 rounded-round place-self-center"
              style={{
                gridColumnStart: targets.bottom.x + 1,
                gridRowStart: targets.bottom.y + 1,
              }}
              // TODO: move
              onClick={() => movePiece(targets.bottom)}
            />
          )}

          {targets.left.x !== active?.x && (
            <div
              className="w-[80%] aspect-square -ml-1 -mt-1 border-2 border-blue-3 opacity-10 rounded-round place-self-center"
              style={{
                gridColumnStart: targets.left.x + 1,
                gridRowStart: targets.left.y + 1,
              }}
              // TODO: move
              onClick={() => movePiece(targets.left)}
            />
          )}

          {targets.right.x !== active?.x && (
            <div
              className="w-[80%] aspect-square -ml-1 -mt-1 border-2 border-blue-3 opacity-10 rounded-round place-self-center"
              style={{
                gridColumnStart: targets.right.x + 1,
                gridRowStart: targets.right.y + 1,
              }}
              // TODO: move
              onClick={() => movePiece(targets.right)}
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

      {pieces.value.map((piece) => (
        <div
          className={cn(
            "rounded-round -ml-1 -mt-1 p-2 w-[80%] aspect-square place-self-center",
            piece.type === "main" && "bg-yellow-3",
            piece.type === "bouncer" && "bg-green-3",
          )}
          style={{
            gridColumn: piece.x + 1,
            gridRow: piece.y + 1,
          }}
          onClick={() => setActive(piece)}
        />
      ))}
    </div>
  );
}
