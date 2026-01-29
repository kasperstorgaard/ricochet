import { parsePuzzle } from "#/util/parser.ts";
import type { Puzzle } from "#/db/types.ts";

const PUZZLES_DIR = new URL("../static/puzzles/", import.meta.url);

/**
 * Loads a puzzle from a markdown file by slug
 */
export async function getPuzzle(puzzleSlug: string): Promise<Puzzle | null> {
  try {
    const filePath = new URL(`${puzzleSlug}.md`, PUZZLES_DIR);
    const content = await Deno.readTextFile(filePath);
    const parsed = parsePuzzle(content);

    return parsed;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return null;
    }
    throw error;
  }
}

/**
 * Lists all available puzzles from markdown files
 */
export async function listPuzzles(): Promise<Puzzle[]> {
  const puzzles: Puzzle[] = [];

  try {
    for await (const entry of Deno.readDir(PUZZLES_DIR)) {
      if (entry.isFile && entry.name.endsWith(".md")) {
        const puzzleSlug = entry.name.replace(/\.md$/, "");
        const puzzle = await getPuzzle(puzzleSlug);
        if (puzzle) {
          puzzles.push(puzzle);
        }
      }
    }
  } catch (error) {
    console.error("Error listing puzzles:", error);
  }

  return puzzles;
}

/**
 * Gets puzzle of the day based on date
 */
export async function getPuzzleOfTheDay(
  date = new Date(),
) {
  const puzzles = await listPuzzles();

  if (puzzles.length === 0) throw new Error("No puzzles available");

  // Use day of year to deterministically select a puzzle
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24),
  );

  const index = dayOfYear % puzzles.length;
  return puzzles[index];
}
