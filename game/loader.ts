import { getDayOfYear } from "#/game/date.ts";
import { parsePuzzle } from "#/game/parser.ts";
import {
  Difficulty,
  PaginatedData,
  PaginationState,
  Puzzle,
  PuzzleManifestEntry,
} from "#/game/types.ts";
import { sortList } from "#/lib/list.ts";

// Default items per page
const ITEMS_PER_PAGE = 6;

/**
 * Fetches puzzle manifest containing metadata for all puzzles.
 * Only returns puzzles with createdAt <= asOf (defaults to now),
 * so future-dated puzzles stay hidden until their release date.
 */
async function getPuzzleManifest(
  baseUrl: string | URL,
): Promise<PuzzleManifestEntry[]> {
  const url = new URL("/puzzles/manifest.json", baseUrl);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to load puzzle manifest (${response.status})`);
  }

  return response.json();
}

async function getAvailableEntries(
  baseUrl: string | URL,
) {
  const today = new Date(Date.now());
  const dayOfYear = getDayOfYear(today);

  const manifest = await getPuzzleManifest(baseUrl);

  return manifest
    .filter((entry) => entry.number <= dayOfYear)
    .filter((entry) => entry.slug !== "tutorial");
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

type ListOptions = Pick<PaginationState, "page" | "itemsPerPage"> & {
  sortBy: "createdAt" | "difficulty" | "number";
  sortOrder: "ascending" | "descending";
  excludeSlugs?: string[];
};

/**
 * Lists all available puzzles with full data (including board).
 * Use listPuzzlesMeta() if you only need metadata for better performance.
 */
export async function listPuzzles(
  baseUrl: string | URL,
  options: ListOptions = {
    page: 1,
    itemsPerPage: ITEMS_PER_PAGE,
    sortBy: "createdAt",
    sortOrder: "descending",
    excludeSlugs: ["tutorial"],
  },
): Promise<PaginatedData<Puzzle>> {
  let entries = await getAvailableEntries(baseUrl);

  entries = entries.filter((entry) =>
    !options.excludeSlugs?.includes(entry.slug)
  );

  entries = sortList(entries, options);

  const totalItems = entries.length;

  const limit = options?.itemsPerPage ?? ITEMS_PER_PAGE;
  const page = options?.page ?? 1;
  const start = (page - 1) * limit;
  const end = start + limit;

  entries = entries.slice(start, end);

  const items = await Promise.all(
    entries.map((entry) => getPuzzle(baseUrl, entry.slug)),
  );

  return {
    items,
    pagination: {
      page,
      itemsPerPage: limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  };
}

/**
 * Gets the latest puzzle — the puzzle of the day
 */
export async function getLatestPuzzle(
  baseUrl: string | URL,
): Promise<Puzzle> {
  const entries = await getAvailableEntries(baseUrl);

  const entry = entries[0];

  if (!entry) throw new Error("Unable to get latest puzzle");

  return getPuzzle(baseUrl, entry.slug);
}

type GetRandomPuzzleOptions = {
  difficulty?: Difficulty[];
  excludeSlugs?: string[];
};

/**
 * Gets a random puzzle from the pool matching the given difficulty options.
 */
export async function getRandomPuzzle(
  baseUrl: string | URL,
  options: GetRandomPuzzleOptions,
): Promise<Puzzle> {
  let entries = await getAvailableEntries(baseUrl);

  entries = entries
    .filter((puzzle) =>
      options.difficulty ? options.difficulty.includes(puzzle.difficulty) : true
    )
    .filter((puzzle) => !options.excludeSlugs?.includes(puzzle.slug));

  if (!entries.length) throw new Error("Unable to get random puzzle");

  const entry = entries[Math.floor(Math.random() * entries.length)];

  return getPuzzle(baseUrl, entry.slug);
}
