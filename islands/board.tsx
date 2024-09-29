import type { Signal } from "@preact/signals";
import { useCallback, useEffect, useMemo, useState } from "preact/hooks";

import { cn } from "../lib/style.ts";
import {
  BoardState,
  getTargets,
  isPositionSame,
  Piece,
  Position,
  Wall,
} from "../util/board.ts";
import { parseBoard, stringifyBoard } from "../util/url.ts";

interface BoardProps {
  cols: Signal<number>;
  rows: Signal<number>;
  destination: Signal<Position>;
  pieces: Signal<Piece[]>;
  walls: Signal<Wall[]>;
}

export default function Board(
  { cols, rows, destination, pieces, walls }: BoardProps,
) {
  const [active, setActive] = useState<Position | null>(null);

  const inactivePieces = useMemo(
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
          cols: cols.value,
          rows: rows.value,
          walls: walls.value,
          pieces: inactivePieces,
        })
        : null,
    [active],
  );

  const spaces = useMemo(() => {
    const positions: Position[][] = [];

    for (let y = 0; y < rows.value; y++) {
      positions[y] = [];

      for (let x = 0; x < cols.value; x++) {
        positions[y].push({ x, y });
      }
    }

    return positions;
  }, []);

  const movePiece = useCallback((position: Position) => {
    if (!active) return;

    const updatedPieces = pieces.value.map((piece) =>
      isPositionSame(piece, active)
        ? {
          ...piece,
          ...position,
        }
        : piece
    );

    const url = new URL(window.location.href);

    const state: BoardState = {
      cols: cols.value,
      rows: rows.value,
      destination: destination.value,
      pieces: updatedPieces,
      walls: walls.value,
    };

    url.search = new URLSearchParams(stringifyBoard(state)).toString();
    self.history.pushState({}, "", url);
    self.dispatchEvent(new CustomEvent("board-change"));

    setActive(position);
  }, [active, pieces.value]);

  useEffect(() => {
    const onBoardChange = () => {
      const state = parseBoard(self.location.search);

      cols.value = state.cols;
      rows.value = state.rows;
      destination.value = state.destination;
      pieces.value = state.pieces;
      walls.value = state.walls;
    };

    self.addEventListener("popstate", onBoardChange);
    self.addEventListener("board-change", onBoardChange);

    return () => {
      self.removeEventListener("popstate", onBoardChange);
      self.removeEventListener("board-change", onBoardChange);
    };
  }, []);

  return (
    <div
      className={cn(
        "grid gap-[var(--gap)] w-full border-t-1 border-l-1 border-gray-7 rounded-2",
      )}
      style={{
        "--gap": "var(--size-1)",
        "--space-w": "clamp(40px, (100vw / 7 / 2), 120px)",
        gridTemplateColumns: `repeat(${cols.value},var(--space-w))`,
        gridTemplateRows: `repeat(${rows.value},var(--space-w))`,
      }}
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

      <div
        className={cn(
          "rounded-round col-start-[var(--destination-x)] row-start-[var(--destination-y)]",
          "-ml-1 -mt-1 p-2 w-[80%] aspect-square place-self-center animate-blink",
          "outline outline-teal-2",
        )}
        style={{
          "--destination-x": destination.value.x,
          "--destination-y": destination.value.y,
        }}
      />

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
            "rounded-round col-start-1 row-start-1 -ml-1 -mt-1 p-[var(--pad)] w-[80%] aspect-square place-self-center",
            "translate-x-[calc((var(--space-w)+var(--gap))*var(--piece-x))]",
            "translate-y-[calc((var(--space-w)+var(--gap))*var(--piece-y))]",
            "transition-transform duration-200 ease-out",
            piece.type === "rook" && "bg-yellow-3",
            piece.type === "bouncer" && "bg-cyan-7",
          )}
          style={{
            "--piece-x": piece.x,
            "--piece-y": piece.y,
            "--pad": "var(--size-2)",
          }}
          onClick={() => setActive(piece)}
        />
      ))}
    </div>
  );
}
