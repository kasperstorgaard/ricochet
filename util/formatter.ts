import { Board, Position, type Puzzle } from "#/db/types.ts";
import { isPositionSame } from "#/util/board.ts";
import { stringify as stringifyYaml } from "$std/yaml/stringify.ts";

/** Combining low line character (U+0332) */
const COMBINING_LOW_LINE = "\u0332";

/** Combining circumflex accent (U+0302) - indicates piece is on destination */
const COMBINING_CIRCUMFLEX = "\u0302";

/**
 * Formats a puzzle into markdown format for easy viewing/editing
 */
export function formatPuzzle(puzzle: Omit<Puzzle, "id">): string {
  const { board, ...metadata } = puzzle;

  // Build frontmatter using YAML stringify
  const yamlContent = stringifyYaml(metadata).trim();
  let markdown = "---\n" + yamlContent + "\n---\n\n";

  // Start code block to prevent markdown formatting
  markdown += "```\n";

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

  // End code block
  markdown += "```\n";

  return markdown;
}

function formatCell(board: Board, position: Position) {
  // Horizontal walls are positioned below the cell
  const wallPosition = { x: position.x, y: position.y + 1 };

  const hasWall = board.walls.some((wall) =>
    wall.orientation === "horizontal" && isPositionSame(wall, wallPosition)
  );
  const isDestination = isPositionSame(board.destination, position);

  // Determine cell character
  const piece = board.pieces.find((item) => isPositionSame(item, position));

  if (piece) {
    let char = piece.type === "rook" ? "@" : "#";
    // Add underline if there's a wall below
    if (hasWall) char += COMBINING_LOW_LINE;
    // Add circumflex if piece is on destination
    if (isDestination) char += COMBINING_CIRCUMFLEX;
    return char;
  }

  if (isDestination) {
    const char = "X";
    return hasWall ? char + COMBINING_LOW_LINE : char;
  }

  if (hasWall) return "_";
  return " ";
}

function formatSeparator(board: Board, position: Position) {
  // Vertical walls are positioned to the right of the cell
  const wallPosition = { x: position.x + 1, y: position.y };

  const hasVerticalWall = board.walls.some((wall) =>
    wall.orientation === "vertical" && isPositionSame(wall, wallPosition)
  );

  if (hasVerticalWall) return "|";
  return " ";
}
