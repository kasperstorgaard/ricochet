import { Board, Piece, Position, Wall } from "../db/types.ts";
import { extractYaml } from "@std/front-matter";
import { ROWS, validateBoard } from "#/util/board.ts";

/**
 * Parses a markdown-based puzzle format into a Board object.
 *
 * Format:
 * - Metadata is in YAML frontmatter
 * - The board is 8x8, 1 line per row
 * - Characters:
 *   - ` ` (space) = empty cell
 *   - `@` = rook (main piece)
 *   - `@̃` = rook on destination (@ + U+0303)
 *   - `@̲` = rook + horizontal wall below (@ + U+0332)
 *   - `@̲̃` = rook on destination + horizontal wall below (@ + U+0303 + U+0332)
 *   - `#` = bouncer (supporting piece)
 *   - `#̃` = bouncer on destination (# + U+0303)
 *   - `#̲` = bouncer + horizontal wall below (# + U+0332)
 *   - `#̲̃` = bouncer on destination + horizontal wall below (# + U+0303 + U+0332)
 *   - `X` = destination (when no piece on it)
 *   - `X̲` = destination + horizontal wall below (X + U+0332)
 *   - `|` = vertical wall (between columns)
 *   - `_` = horizontal wall (standalone, below empty cell)
 *
 * Example:
 * ```
 * ---
 * name: Simple Puzzle
 * slug: simple-puzzle
 * ---
 *
 * A simple puzzle.
 *
 * + A B C D E F G H +
 * 1       @̲ _       |
 * 2 #    |          |
 * 3                 |
 * 4                 |
 * 5                 |
 * 6         _ _     |
 * 7     #           |
 * 8           X|    |
 * +-----------------+
 * ```
 */

export type PuzzleMetadata = {
  name: string;
  slug?: string;
  difficulty?: string;
  author?: string;
  [key: string]: string | undefined;
};

export type ParsedPuzzle = {
  metadata: PuzzleMetadata;
  board: Board;
  description?: string;
};

export class ParserError extends Error {
  constructor(message: string) {
    super(`Puzzle parse error: ${message}`);
    this.name = "PuzzleParseError";
  }
}

/** Character mappings for board elements */
const CELL_CHARS = {
  rook: "@",
  rookWall: "@̲", // @ + U+0332 (combining low line)
  bouncer: "#",
  bouncerWall: "#̲", // # + U+0332
  destination: "X",
  destinationWall: "X̲", // X + U+0332
  empty: " ",
  wallVertical: "|",
  wallHorizontal: "_",
} as const;

/** Combining low line character (U+0332) */
const COMBINING_LOW_LINE = "\u0332";
/** Combining tilde character (U+0303) */
const COMBINING_TILDE = "\u0303";

/**
 * Parses the board grid into pieces, walls, and destination
 */
function parseBoard(rows: string[]): Board {
  const pieces: Piece[] = [];
  let destination: Position | undefined;
  const walls: Wall[] = [];

  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];

    // Row content is already extracted (no row number prefix)
    const cellContent = row;

    for (let x = 0; x < 8; x++) {
      // Each cell is at position x*2 in the content (char + space/separator)
      const charIndex = x * 2;
      if (charIndex >= cellContent.length) break;

      const char = cellContent[charIndex];

      // Check for combining characters after the main character
      let nextCharOffset = 1;
      let hasTilde = false;
      let hasUnderline = false;

      // Check for combining tilde (U+0303) and/or combining low line (U+0332)
      // They can appear in any order after the base character
      while (charIndex + nextCharOffset < cellContent.length) {
        const nextChar = cellContent[charIndex + nextCharOffset];
        if (nextChar === COMBINING_TILDE) {
          hasTilde = true;
          nextCharOffset++;
        } else if (nextChar === COMBINING_LOW_LINE) {
          hasUnderline = true;
          nextCharOffset++;
        } else {
          break;
        }
      }

      // Check for vertical wall (appears after a cell, at odd positions)
      // But we handle it as the separator character
      if (x > 0) {
        // Check the separator before this cell (at position x*2 - 1)
        const sepIndex = x * 2 - 1;
        if (
          sepIndex >= 0 && cellContent[sepIndex] === CELL_CHARS.wallVertical
        ) {
          walls.push({ x: x - 1, y, orientation: "vertical" });
        }
      }

      // If the cell itself is a vertical wall, it's positioned between this cell and the previous
      // Wall at x means it's to the right of column x
      if (char === CELL_CHARS.wallVertical) {
        if (x > 0) {
          walls.push({ x: x, y, orientation: "vertical" });
        }
        continue;
      }

      // Check for horizontal wall standalone
      if (char === CELL_CHARS.wallHorizontal) {
        walls.push({ x, y, orientation: "horizontal" });
        continue;
      }

      // Check for rook
      if (char === "@") {
        pieces.push({ x, y, type: "rook" });

        // If this piece has a tilde, it's on the destination
        if (hasTilde) {
          if (destination) {
            throw new ParserError("Multiple destinations found");
          }
          destination = { x, y };
        }

        if (hasUnderline) walls.push({ x, y, orientation: "horizontal" });

        continue;
      }

      // Check for bouncer
      if (char === "#") {
        pieces.push({ x, y, type: "bouncer" });

        // If this piece has a tilde, it's on the destination
        if (hasTilde) {
          if (destination) {
            throw new ParserError("Multiple destinations found");
          }
          destination = { x, y };
        }

        if (hasUnderline) walls.push({ x, y, orientation: "horizontal" });

        continue;
      }

      // Check for destination
      if (char === "~") {
        if (destination) {
          throw new ParserError("Multiple destinations found");
        }

        destination = { x, y };
        if (hasUnderline) walls.push({ x, y, orientation: "horizontal" });
        continue;
      }

      // Empty space
      if (char === " ") continue;

      // Skip combining characters that might appear standalone
      if (char === COMBINING_LOW_LINE) continue;

      throw new ParserError(
        `Unknown cell character '${char}' at position (${x}, ${y})`,
      );
    }
  }

  return validateBoard({
    destination,
    pieces,
    walls,
  });
}

/**
 * Main parser function - parses a markdown puzzle file into a ParsedPuzzle
 */
export function parsePuzzle(content: string): ParsedPuzzle {
  const { attrs, body } = extractYaml<PuzzleMetadata>(content);

  if (!attrs.name) {
    throw new ParserError("Metadata must include 'name' field");
  }

  const description = extractDescription(body);
  const rows = extractRows(body);
  if (rows.length !== ROWS) {
    throw new ParserError(`Expected ${ROWS} board rows, found ${rows.length}`);
  }

  const board = parseBoard(rows);

  return {
    metadata: attrs,
    board,
    description,
  };
}

/**
 * Extracts description text before the board grid
 */
function extractDescription(content: string): string | undefined {
  const lines = content.split(/[\r\n]/);
  const descLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Stop when we hit the grid header
    if (isHeader(trimmed)) break;
    if (trimmed) descLines.push(trimmed);
  }

  return descLines.join("\n").trim() || undefined;
}

/**
 * Extracts the board rows from the content.
 */
function extractRows(content: string): string[] {
  const lines = content.split(/[\r\n]/);
  const rows: string[] = [];

  const rowMatcher = /^[1-8]\s(.{16})|/;
  let inGrid = false;

  for (const line of lines) {
    if (isHeader(line)) {
      inGrid = true;
      continue;
    }
    if (isFooter(line)) break;
    if (!inGrid) continue;

    const rowMatches = line.match(rowMatcher) ?? [];
    if (rowMatches[1]) rows.push(rowMatches[1]);
  }

  return rows;
}

/**
 * Checks if a line is the header (starts with +)
 */
function isHeader(line: string) {
  return /^\s*\+\sA/.test(line);
}

/**
 * Checks if a line is the footer (starts with +-)
 */
function isFooter(line: string) {
  return /^\s*\+-/.test(line);
}
