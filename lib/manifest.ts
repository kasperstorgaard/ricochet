import { extractYaml } from "@std/front-matter";
import { Puzzle, PuzzleManifestEntry } from "#/util/types.ts";

const PUZZLES_DIR = "./static/puzzles";

/**
 * Regenerates the puzzle manifest from the markdown files in static/puzzles.
 * Reads all .md files, extracts YAML front matter, and writes manifest.json.
 */
export async function updateManifest() {
  let entries: PuzzleManifestEntry[] = [];

  for await (const entry of Deno.readDir(PUZZLES_DIR)) {
    if (entry.isFile && entry.name.endsWith(".md")) {
      const content = await Deno.readTextFile(
        `${PUZZLES_DIR}/${entry.name}`,
      );
      const { attrs } = extractYaml<Omit<Puzzle, "board">>(content);

      entries.push({
        slug: attrs.slug,
        name: attrs.name,
        createdAt: attrs.createdAt,
        difficulty: attrs.difficulty,
      });
    }
  }

  entries = entries.sort((a, b) =>
    a.createdAt.getTime() - b.createdAt.getTime()
  );

  await Deno.writeTextFile(
    `${PUZZLES_DIR}/manifest.json`,
    JSON.stringify(entries, null, 2),
  );
}
