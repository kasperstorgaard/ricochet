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
  const gap = width * 0.02;
  const cellSize = (width - (7 * gap)) / 8;
  const pieceSize = cellSize * 0.7;

  // Cell top-left position accounting for gaps
  const cellX = (x: number) => x * (cellSize + gap);
  const cellY = (y: number) => y * (cellSize + gap);

  // Helper to get cell center coordinates
  const getCenter = (x: number, y: number) => ({
    cx: cellX(x) + cellSize / 2,
    cy: cellY(y) + cellSize / 2,
  });

  // Destination marker - fills the cell like the real board
  const destX = cellX(board.destination.x);
  const destY = cellY(board.destination.y);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${width} ${height}`}
      {...rest}
    >
      {/* Destination marker - border with centered X icon */}
      <g stroke="var(--color-ui-1)" fill="none">
        <rect
          x={destX}
          y={destY}
          width={cellSize}
          height={cellSize}
          strokeWidth="2"
        />
        <line
          x1={destX + cellSize * 0.25}
          y1={destY + cellSize * 0.25}
          x2={destX + cellSize * 0.75}
          y2={destY + cellSize * 0.75}
          strokeWidth="3"
          stroke-linecap="round"
        />
        <line
          x1={destX + cellSize * 0.25}
          y1={destY + cellSize * 0.75}
          x2={destX + cellSize * 0.75}
          y2={destY + cellSize * 0.25}
          strokeWidth="3"
          stroke-linecap="round"
        />
      </g>

      {/* Walls - with gaps to look like separate segments */}
      {board.walls.map((wall: Wall, idx) => {
        const px = cellX(wall.x);
        const py = cellY(wall.y);

        if (wall.orientation === "vertical") {
          return (
            <line
              key={`wall-${idx}`}
              x1={px}
              y1={py}
              x2={px}
              y2={py + cellSize}
              strokeWidth="3"
              stroke="var(--color-ui-4)"
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
              stroke="var(--color-ui-4)"
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
              fill="var(--color-ui-2)"
            />
          );
        } else {
          // Bouncers are same size as rooks, with rounded corners
          const size = pieceSize;
          const half = size / 2;
          const cornerRadius = size * 0.15; // Slightly rounded corners
          return (
            <rect
              key={`piece-${idx}`}
              x={cx - half}
              y={cy - half}
              width={size}
              height={size}
              rx={cornerRadius}
              ry={cornerRadius}
              fill="var(--color-ui-3)"
            />
          );
        }
      })}
    </svg>
  );
}
