import { Puzzle, Solution } from "#/db/types.ts";
import { page, PageProps } from "fresh";
import { useSignal } from "@preact/signals";

import { getPuzzleSolution, listPuzzleSolutions } from "#/db/kv.ts";
import Board from "#/islands/board.tsx";
import { SolutionsPanel } from "#/islands/solutions-panel.tsx";
import { encodeState } from "#/util/url.ts";
import { Header } from "#/components/header.tsx";
import { getPuzzle } from "#/util/loader.ts";
import { Main } from "#/components/main.tsx";
import { define } from "../../../core.ts";

type Data = {
  puzzle: Puzzle;
  solutions: Solution[];
  solution: Solution | null;
};

export const handler = define.handlers<Data>({
  async GET(ctx) {
    const req = ctx.req;
    const { slug, solutionId } = ctx.params;

    const puzzle = await getPuzzle(slug);
    if (!puzzle) {
      throw new Error(`Unable to find a puzzle with slug: ${slug}`);
    }

    const solutions = await listPuzzleSolutions(slug, {
      limit: 10,
      byMoves: true,
    });

    const solution = solutionId
      ? await getPuzzleSolution(slug, solutionId)
      : solutions[0];

    if (solutions.length && !solution) {
      throw new Error(`Unable to find solution with id: ${solutionId}`);
    }

    const url = new URL(req.url);
    if (!url.searchParams.has("m") && solution) {
      url.search = encodeState(solution);

      return Response.redirect(url);
    }

    return page({
      puzzle,
      solutions,
      solution,
    });
  },
});

export default define.page(function SolutionPage(props: PageProps<Data>) {
  const puzzle = useSignal(props.data.puzzle);
  const href = useSignal(props.url.href);
  const mode = useSignal<"replay">("replay");

  const navItems = [
    { name: "home", href: "/" },
    { name: "puzzles", href: "/puzzles" },
    {
      name: props.data.puzzle.name,
      href: `/puzzles/${props.data.puzzle.slug}`,
    },
    { name: "solutions", href: `/puzzles/${props.data.puzzle.slug}/solutions` },
  ];

  return (
    <>
      <Main>
        <Header items={navItems} />

        <h1 className="text-5 text-brand">{props.data.puzzle.name}</h1>

        <Board
          puzzle={puzzle}
          href={href}
          mode={mode}
        />
      </Main>

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
});
