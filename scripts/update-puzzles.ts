import { formatPuzzle } from "#/game/formatter.ts";
import { parsePuzzle } from "#/game/parser.ts";
import { solve } from "#/game/solver.ts";

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
        if (moves.length === puzzle.minMoves) continue;

        const markdown = formatPuzzle({
          ...puzzle,
          minMoves: moves.length,
        });

        await Deno.writeTextFile(`${PUZZLES_DIR}/${puzzle.slug}.md`, markdown);
      } catch {
        throw new Error("Unable to solve puzzle");
      }
    }
  }
}
