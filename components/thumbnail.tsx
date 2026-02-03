import { HTMLAttributes } from "preact";

import type { Board, Piece, Wall } from "#/util/types.ts";

export type ThumbnailProps = HTMLAttributes<SVGSVGElement> & {
  board: Board;
  width?: number;
  height?: number;
};

/**
 * SVG thumbnail component for a puzzle board.
 * Uses CSS variables that automatically adapt to user's theme preference.
 */
export function Thumbnail({
  board,
  width = 400,
  height = 400,
  ...rest
}: ThumbnailProps) {
  const cellSize = width / 8;
  const pieceSize = cellSize * 0.7;

  // Helper to get cell center coordinates
  const getCenter = (x: number, y: number) => ({
    cx: x * cellSize + cellSize / 2,
    cy: y * cellSize + cellSize / 2,
  });

  // Destination marker (X)
  const { cx: destX, cy: destY } = getCenter(
    board.destination.x,
    board.destination.y,
  );
  const destSize = cellSize * 0.5;
  const destHalf = destSize / 2;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${width} ${height}`}
      {...rest}
    >
      {/* Background */}
      {/* <rect width={width} height={height} stroke="var(--surface-2)" /> */}

      {/* Destination marker */}
      <g stroke="var(--ui-1)" strokeWidth="2" fill="none">
        <line
          x1={destX - destHalf}
          y1={destY - destHalf}
          x2={destX + destHalf}
          y2={destY + destHalf}
        />
        <line
          x1={destX - destHalf}
          y1={destY + destHalf}
          x2={destX + destHalf}
          y2={destY - destHalf}
        />
      </g>

      {/* Walls */}
      {board.walls.map((wall: Wall, idx) => {
        const px = wall.x * cellSize;
        const py = wall.y * cellSize;

        if (wall.orientation === "vertical") {
          return (
            <line
              key={`wall-${idx}`}
              x1={px}
              y1={py}
              x2={px}
              y2={py + cellSize}
              strokeWidth="3"
              stroke="var(--ui-4)"
            />
          );
        } else {
          return (
            <line
              key={`wall-${idx}`}
              x1={px}
              y1={py}
              x2={px + cellSize}
              y2={py}
              strokeWidth="3"
              stroke="var(--ui-4)"
            />
          );
        }
      })}

      {/* Pieces */}
      {board.pieces.map((piece: Piece, idx) => {
        const { cx, cy } = getCenter(piece.x, piece.y);
        const radius = pieceSize / 2;

        if (piece.type === "rook") {
          return (
            <circle
              key={`piece-${idx}`}
              cx={cx}
              cy={cy}
              r={radius}
              fill="var(--ui-2)"
            />
          );
        } else {
          const size = pieceSize * 0.9;
          const half = size / 2;
          return (
            <rect
              key={`piece-${idx}`}
              x={cx - half}
              y={cy - half}
              width={size}
              height={size}
              fill="var(--ui-3)"
            />
          );
        }
      })}
    </svg>
  );
}
