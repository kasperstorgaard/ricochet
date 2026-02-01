import { parsePuzzle } from "#/util/parser.ts";
import type { Puzzle } from "#/db/types.ts";
import { pickByDay } from "#/util/date.ts";
import { ErrorOverlay } from "$fresh/src/server/error_overlay.tsx";

const PUZZLES_DIR = new URL("../static/puzzles/", import.meta.url);

/**
 * Loads a puzzle from a markdown file by slug
 */
export async function getPuzzle(
  puzzleSlug: string,
): Promise<Puzzle> {
  const filePath = new URL(`${puzzleSlug}.md`, PUZZLES_DIR);
  const content = await Deno.readTextFile(filePath);
  const parsed = parsePuzzle(content);

  return parsed;
}

type ListOptions = {
  sortBy?: "date";
  limit?: number;
  page?: number;
};

/**
 * Lists all available puzzles from markdown files
 */
export async function listPuzzles(options?: ListOptions) {
  let puzzles: Puzzle[] = [];

  for await (const entry of Deno.readDir(PUZZLES_DIR)) {
    if (entry.isFile && entry.name.endsWith(".md")) {
      const puzzleSlug = entry.name.replace(/\.md$/, "");
      const puzzle = await getPuzzle(puzzleSlug);

      puzzles.push(puzzle);
    }
  }

  if (options?.sortBy === "date") {
    puzzles = puzzles.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }

  if (options?.limit) {
    const page = options.page ?? 1;

    const start = (page - 1) * options.limit;
    const end = start + options.limit;

    puzzles = puzzles.slice(start, end);
  }

  return puzzles;
}

/**
 * Gets puzzle of the day based on the current date.
 * Cycles through puzzles sorted by date (oldest first).
 *
 * Note: Adding or removing puzzles will change the rotation.
 * Excludes tutorial puzzles from rotation.
 */
export async function getPuzzleOfTheDay(
  date = new Date(Date.now()),
) {
  const puzzles = (await listPuzzles({ sortBy: "date" }))
    .filter((p) => !p.slug.startsWith("tutorial"));

  // Sort oldest first for consistent rotation base
  const sortedPuzzles = puzzles.sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateA - dateB; // Oldest first
  });

  const puzzle = pickByDay(sortedPuzzles, date);

  if (!puzzle) throw new Error("Unable to get puzzle of the day");

  return puzzle;
}
