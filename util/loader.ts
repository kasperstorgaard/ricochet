import { parsePuzzle } from "#/util/parser.ts";
import { pickByDay } from "#/util/date.ts";
import { Puzzle, PuzzleManifestEntry } from "#/util/types.ts";

/**
 * Fetches puzzle manifest containing metadata for all puzzles.
 * Manifest is pre-sorted by createdAt descending (newest first).
 */
async function getPuzzleManifest(
  baseUrl: string | URL,
): Promise<PuzzleManifestEntry[]> {
  const url = new URL("/puzzles/manifest.json", baseUrl);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to load puzzle manifest (${response.status})`);
  }

  return await response.json();
}

/**
 * Loads a puzzle from a markdown file by slug.
 * Fetches from the static file server to work both locally and on Deno Deploy.
 */
export async function getPuzzle(
  baseUrl: string | URL,
  puzzleSlug: string,
): Promise<Puzzle> {
  const url = new URL(`/puzzles/${puzzleSlug}.md`, baseUrl);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to load puzzle: ${puzzleSlug} (${response.status})`,
    );
  }

  const content = await response.text();
  const parsed = parsePuzzle(content);

  return parsed;
}

type ListOptions = {
  limit?: number;
  page?: number;
};

/**
 * Lists puzzle metadata from the manifest.
 * For full puzzle data including board, use getPuzzle() for each entry.
 *
 * Manifest is pre-sorted by createdAt descending (newest first).
 */
export async function listPuzzlesMeta(
  baseUrl: string | URL,
  options?: ListOptions,
): Promise<PuzzleManifestEntry[]> {
  let entries = await getPuzzleManifest(baseUrl);

  if (options?.limit) {
    const page = options.page ?? 1;
    const start = (page - 1) * options.limit;
    const end = start + options.limit;
    entries = entries.slice(start, end);
  }

  return entries;
}

/**
 * Lists all available puzzles with full data (including board).
 * Use listPuzzlesMeta() if you only need metadata for better performance.
 */
export async function listPuzzles(
  baseUrl: string | URL,
  options?: ListOptions,
): Promise<Puzzle[]> {
  const entries = await listPuzzlesMeta(baseUrl, options);

  const puzzles = await Promise.all(
    entries.map((entry) => getPuzzle(baseUrl, entry.slug)),
  );

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
  baseUrl: string | URL,
  date = new Date(Date.now()),
): Promise<Puzzle> {
  const entries = (await listPuzzlesMeta(baseUrl))
    .filter((p) => !p.slug.startsWith("tutorial"));

  // Sort oldest first for consistent rotation base
  const sortedEntries = entries.sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateA - dateB; // Oldest first
  });

  const entry = pickByDay(sortedEntries, date);

  if (!entry) throw new Error("Unable to get puzzle of the day");

  return getPuzzle(baseUrl, entry.slug);
}
