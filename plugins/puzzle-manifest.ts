import { extractYaml } from "@std/front-matter";
import { Plugin } from "vite";

import { Puzzle, PuzzleManifestEntry } from "#/util/types.ts";

/**
 * Vite build plugin that generates a file manifest at static/puzzles/manifest.json.
 * Provides a full list of puzzles with relevant metadata, so we can retrieve them at runtime.
 */
export function puzzleManifest(): Plugin {
  return {
    name: "puzzle-manifest",
    async buildStart() {
      const puzzlesDir = "./static/puzzles";
      let entries: PuzzleManifestEntry[] = [];

      for await (const entry of Deno.readDir(puzzlesDir)) {
        if (entry.isFile && entry.name.endsWith(".md")) {
          const content = await Deno.readTextFile(
            `${puzzlesDir}/${entry.name}`,
          );
          const { attrs } = extractYaml<Omit<Puzzle, "board">>(content);

          entries.push({
            slug: attrs.slug,
            name: attrs.name,
            createdAt: attrs.createdAt,
          });
        }
      }

      entries = entries.sort((a, b) =>
        a.createdAt.getTime() - b.createdAt.getTime()
      );

      const manifestPath = `${puzzlesDir}/manifest.json`;
      await Deno.writeTextFile(manifestPath, JSON.stringify(entries, null, 2));
    },
  };
}
