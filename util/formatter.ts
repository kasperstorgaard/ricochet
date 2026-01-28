import { Board, Position } from "../db/types.ts";
import { isPositionSame } from "#/util/board.ts";
import type { ParsedPuzzle } from "./parser.ts";

/** Combining low line character (U+0332) */
const COMBINING_LOW_LINE = "\u0332";

/** Combining tilde character (U+0303) - indicates piece is on destination */
const COMBINING_TILDE = "\u0303";

/**
 * Formats a puzzle into markdown format for easy viewing/editing
 */
export function formatPuzzle(puzzle: ParsedPuzzle): string {
  const { metadata, board, description } = puzzle;

  // Build frontmatter
  let markdown = "---\n";
  for (const [key, value] of Object.entries(metadata)) {
    if (value !== undefined) {
      markdown += `${key}: ${value}\n`;
    }
  }

  markdown += "---\n\n";

  // Add description if present
  if (description) {
    markdown += description + "\n\n";
  }

  // Header
  markdown += "+ A B C D E F G H +\n";

  // Build rows
  for (let y = 0; y < 8; y++) {
    let row = `${y + 1} `;

    for (let x = 0; x < 8; x++) {
      row += formatCell(board, { x, y });
      row += formatSeparator(board, { x, y });
    }

    markdown += row + "|\n";
  }

  // Footer
  markdown += "+-----------------+\n";

  return markdown;
}

function formatCell(board: Board, position: Position) {
  const wallPosition = { x: position.x, y: position.y + 1 };
  const hasWall = board.walls.some((wall) =>
    wall.orientation === "horizontal" && isPositionSame(wall, wallPosition)
  );
  const isDestination = isPositionSame(board.destination, position);

  // Determine cell character
  const piece = board.pieces.find((item) => isPositionSame(item, position));

  if (piece) {
    let char = piece.type === "rook" ? "@" : "#";
    // Add tilde if piece is on destination
    if (isDestination) char += COMBINING_TILDE;
    // Add underline if there's a wall below
    if (hasWall) char += COMBINING_LOW_LINE;
    return char;
  }

  if (isDestination) {
    const char = "~";
    return hasWall ? char + COMBINING_LOW_LINE : char;
  }

  if (hasWall) return "_";
  return " ";
}

function formatSeparator(board: Board, position: Position) {
  const adjustedPosition = { x: position.x + 1, y: position.y };
  const hasVerticalWall = board.walls.some((wall) =>
    wall.orientation === "vertical" && isPositionSame(wall, adjustedPosition)
  );

  if (hasVerticalWall) return "|";
  return " ";
}
