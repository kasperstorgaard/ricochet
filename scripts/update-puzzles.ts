import { parsePuzzle } from "../util/parser.ts";
import { solve } from "../util/solver.ts";
import { formatPuzzle } from "../util/formatter.ts";

const PUZZLES_DIR = "./static/puzzles";

// Run tasks to update puzzles
updateDifficulties();

/**
 * Updates the difficulties in all static puzzle files
 */
async function updateDifficulties() {
  for await (const entry of Deno.readDir(PUZZLES_DIR)) {
    if (entry.isFile && entry.name.endsWith(".md")) {
      // TODO: make this fancier
      console.log(`Updating difficulty for ${entry.name}.md...`);

      const content = await Deno.readTextFile(
        `${PUZZLES_DIR}/${entry.name}`,
      );

      const puzzle = parsePuzzle(content);

      try {
        const moves = solve(puzzle);
        if (moves.length === puzzle.difficulty) continue;

        const markdown = formatPuzzle({
          ...puzzle,
          difficulty: moves.length,
        });

        await Deno.writeTextFile(`${PUZZLES_DIR}/${puzzle.slug}.md`, markdown);
      } catch {
        throw new Error("Unable to solve puzzle");
      }
    }
  }
}
