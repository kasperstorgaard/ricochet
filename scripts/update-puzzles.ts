/**
 * Solves all puzzles with missing or zero minMoves and writes the result back.
 *
 * Usage: deno task update-puzzles
 */
import { formatPuzzle } from "#/game/formatter.ts";
import { parsePuzzle } from "#/game/parser.ts";
import { solve } from "#/game/solver.ts";

const PUZZLES_DIR = new URL("../static/puzzles", import.meta.url).pathname;

let updated = 0;
let skipped = 0;
let failed = 0;

for await (const entry of Deno.readDir(PUZZLES_DIR)) {
  if (!entry.isFile || !entry.name.endsWith(".md")) continue;

  const path = `${PUZZLES_DIR}/${entry.name}`;
  const markdown = await Deno.readTextFile(path);
  const puzzle = parsePuzzle(markdown);

  if (puzzle.minMoves) {
    skipped++;
    continue;
  }

  try {
    const moves = solve(puzzle);
    const updated_markdown = formatPuzzle({ ...puzzle, minMoves: moves.length });
    await Deno.writeTextFile(path, updated_markdown);
    console.log(`${entry.name}: ${moves.length} moves`);
    updated++;
  } catch (err) {
    console.error(`${entry.name}: failed — ${(err as Error).message}`);
    failed++;
  }
}

console.log(`\nDone. Updated: ${updated}, skipped: ${skipped}, failed: ${failed}`);
