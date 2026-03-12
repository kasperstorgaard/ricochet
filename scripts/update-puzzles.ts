/**
 * Solves all puzzles with missing or zero minMoves and writes the result back.
 * Reads and solves in parallel — one worker per puzzle.
 *
 * Usage: deno task update-puzzles
 */
import { formatPuzzle } from "#/game/formatter.ts";
import { parsePuzzle } from "#/game/parser.ts";
import { solve } from "#/game/solver.ts";

const PUZZLES_DIR = new URL("../static/puzzles", import.meta.url).pathname;

const entries: { path: string; name: string }[] = [];

for await (const entry of Deno.readDir(PUZZLES_DIR)) {
  if (entry.isFile && entry.name.endsWith(".md")) {
    entries.push({ path: `${PUZZLES_DIR}/${entry.name}`, name: entry.name });
  }
}

// Read all files in parallel
const puzzles = await Promise.all(
  entries.map(async ({ path, name }) => {
    const markdown = await Deno.readTextFile(path);
    return { path, name, puzzle: parsePuzzle(markdown) };
  }),
);

const toSolve = puzzles.filter((p) => !p.puzzle.minMoves);
const skipped = puzzles.length - toSolve.length;

console.log(
  `Solving ${toSolve.length} puzzles (${skipped} already have minMoves)…\n`,
);

// Solve all in parallel — each runs in its own worker
const results = await Promise.allSettled(
  toSolve.map(async ({ path, name, puzzle }) => {
    const moves = solve(puzzle.board);
    const markdown = formatPuzzle({ ...puzzle, minMoves: moves.length });
    await Deno.writeTextFile(path, markdown);
    console.log(`  ${name}: ${moves.length} moves`);
    return moves.length;
  }),
);

const updated = results.filter((r) => r.status === "fulfilled").length;
const failed = results.filter((r) => r.status === "rejected").length;

for (const [i, result] of results.entries()) {
  if (result.status === "rejected") {
    console.error(`  ${toSolve[i].name}: failed — ${result.reason}`);
  }
}

console.log(
  `\nDone. Updated: ${updated}, skipped: ${skipped}, failed: ${failed}`,
);
