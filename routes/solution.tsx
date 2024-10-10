import { Puzzle, Solution } from "#/db/types.ts";
import { Handlers, PageProps } from "$fresh/server.ts";

import {
  getPuzzle,
  getSolution,
  getSolutionRank,
  getSolutions,
} from "#/db/kv.ts";

type Data = {
  puzzle: Puzzle;
  solutions: Solution[];
  solution: Solution;
  rank: number;
};

export const handler: Handlers<Data> = {
  async GET(_req, ctx) {
    const { puzzleId, solutionId } = ctx.params;

    const puzzle = await getPuzzle(puzzleId);
    if (!puzzle) {
      throw new Error(`Unable to find a puzzle with id: ${puzzleId}`);
    }

    const solution = await getSolution(puzzleId, solutionId);
    if (!solution) {
      throw new Error(`Unable to find solution with id: ${solutionId}`);
    }

    const solutions = await getSolutions(puzzleId);
    const rank = await getSolutionRank(puzzleId, solutionId);

    return ctx.render({
      puzzle,
      solutions,
      solution,
      rank,
    });
  },
};

export default function SolutionDetails(props: PageProps<Data>) {
  return (
    <div class="flex flex-col col-[2/3] w-full gap-fl-2 py-1">
      Solutions
    </div>
  );
}
