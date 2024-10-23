import { Puzzle, Solution } from "#/db/types.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { useSignal } from "@preact/signals";

import { getPuzzle, getPuzzleSolution, listPuzzleSolutions } from "#/db/kv.ts";
import Board from "#/islands/board.tsx";
import { SolutionsPanel } from "#/islands/solutions-panel.tsx";
import { encodeState } from "#/util/url.ts";
import { Header } from "#/components/header.tsx";

type Data = {
  puzzle: Puzzle;
  solutions: Solution[];
  solution: Solution | null;
};

export const handler: Handlers<Data> = {
  async GET(req, ctx) {
    const { puzzleId, solutionId } = ctx.params;

    const puzzle = await getPuzzle(puzzleId);
    if (!puzzle) {
      throw new Error(`Unable to find a puzzle with id: ${puzzleId}`);
    }

    const solutions = await listPuzzleSolutions(puzzleId, {
      limit: 10,
      byMoves: true,
    });

    const solution = solutionId
      ? await getPuzzleSolution(puzzleId, solutionId)
      : solutions[0];

    if (solutions.length && !solution) {
      throw new Error(`Unable to find solution with id: ${solutionId}`);
    }

    const url = new URL(req.url);
    if (!url.searchParams.has("m") && solution) {
      url.search = encodeState(solution);

      return Response.redirect(url, 301);
    }

    return ctx.render({
      puzzle,
      solutions,
      solution,
    });
  },
};

export default function SolutionPage(props: PageProps<Data>) {
  const puzzle = useSignal(props.data.puzzle);
  const href = useSignal(props.url.href);
  const hasSolution = useSignal(false);

  const navItems = [
    { name: "home", href: "/" },
    { name: "puzzles", href: "/puzzles/" },
    { name: props.data.puzzle.name, href: `/puzzles/${props.data.puzzle.id}` },
    { name: "solutions", href: `/puzzles/${props.data.puzzle.id}/solutions` },
  ];

  return (
    <>
      <div class="flex flex-col col-[2/3] w-full gap-fl-2">
        <Header items={navItems} />

        <h1 className="text-5 text-brand">{props.data.puzzle.name}</h1>

        <Board
          puzzle={puzzle}
          href={href}
          hasSolution={hasSolution}
          isReplayMode
        />
      </div>

      {props.data.solutions.length
        ? (
          <SolutionsPanel
            solutions={props.data.solutions}
            solution={props.data.solution}
            href={href}
          />
        )
        : null}
    </>
  );
}
