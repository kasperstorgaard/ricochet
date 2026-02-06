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
  const pieceSize = cellSize * 0.8; // More realistic piece sizing
  const wallGap = cellSize * 0.08; // Gap at each end of walls

  // Helper to get cell center coordinates
  const getCenter = (x: number, y: number) => ({
    cx: x * cellSize + cellSize / 2,
    cy: y * cellSize + cellSize / 2,
  });

  // Destination marker - fills the cell like the real board
  const destX = board.destination.x * cellSize;
  const destY = board.destination.y * cellSize;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${width} ${height}`}
      {...rest}
    >
      {/* Destination marker - fills the cell with border and X */}
      <g stroke="var(--color-ui-1)" strokeWidth="2" fill="none">
        <rect x={destX} y={destY} width={cellSize} height={cellSize} />
        <line
          x1={destX}
          y1={destY}
          x2={destX + cellSize}
          y2={destY + cellSize}
        />
        <line
          x1={destX}
          y1={destY + cellSize}
          x2={destX + cellSize}
          y2={destY}
        />
      </g>

      {/* Walls - with gaps to look like separate segments */}
      {board.walls.map((wall: Wall, idx) => {
        const px = wall.x * cellSize;
        const py = wall.y * cellSize;

        if (wall.orientation === "vertical") {
          return (
            <line
              key={`wall-${idx}`}
              x1={px}
              y1={py + wallGap}
              x2={px}
              y2={py + cellSize - wallGap}
              strokeWidth="3"
              stroke="var(--color-ui-4)"
            />
          );
        } else {
          return (
            <line
              key={`wall-${idx}`}
              x1={px + wallGap}
              y1={py}
              x2={px + cellSize - wallGap}
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
