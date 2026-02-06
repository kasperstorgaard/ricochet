import { Solution } from "#/db/types.ts";
import { define } from "#/core.ts";
import { getPuzzle } from "#/util/loader.ts";
import { Puzzle } from "#/util/types.ts";
import { encodeState } from "#/util/url.ts";
import { solve } from "#/util/solver.ts";

type Data = {
  puzzle: Puzzle;
  solutions: Solution[];
  solution: Solution | null;
};

export const handler = define.handlers<Data>({
  async GET(ctx) {
    const req = ctx.req;
    const { slug } = ctx.params;

    const puzzle = await getPuzzle(ctx.url.origin, slug);
    if (!puzzle) {
      throw new Error(`Unable to find a puzzle with slug: ${slug}`);
    }

    const url = new URL(req.url);
    const solution = solve(puzzle, {
      maxDepth: 15,
      maxIterations: 300000,
    });

    if (!solution) throw new Error("Unable to auto-solve the puzzle");

    url.search = encodeState({ moves: solution! });
    url.pathname = `/puzzles/${slug}/solutions`;

    return Response.redirect(url);
  },
});
