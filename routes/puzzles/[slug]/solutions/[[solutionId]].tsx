import { useSignal } from "@preact/signals";
import { HttpError, page } from "fresh";

import { Header } from "#/components/header.tsx";
import { Main } from "#/components/main.tsx";
import { getPuzzleSolution, listPuzzleSolutions } from "#/db/kv.ts";
import { Solution } from "#/db/types.ts";
import Board from "#/islands/board.tsx";
import { SolutionsPanel } from "#/islands/solutions-panel.tsx";
import { define } from "#/core.ts";
import { getPuzzle } from "#/util/loader.ts";
import { Puzzle } from "#/util/types.ts";
import { encodeState } from "#/util/url.ts";

type Data = {
  puzzle: Puzzle;
  solutions: Solution[];
  solution: Solution | null;
};

export const handler = define.handlers<Data>({
  async GET(ctx) {
    const req = ctx.req;
    const { slug, solutionId } = ctx.params;

    const puzzle = await getPuzzle(ctx.url.origin, slug);
    if (!puzzle) {
      throw new HttpError(404, `Unable to find a puzzle with slug: ${slug}`);
    }

    const solutions = await listPuzzleSolutions(slug, {
      limit: 8,
      byMoves: true,
    });

    const solution = solutionId
      ? await getPuzzleSolution(slug, solutionId)
      : solutions[0];

    if (solutions.length && !solution) {
      throw new HttpError(
        404,
        `Unable to find solution with id: ${solutionId}`,
      );
    }

    const url = new URL(req.url);
    if (!url.searchParams.has("moves") && solution) {
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

export default define.page<typeof handler>(function SolutionPage(props) {
  const puzzle = useSignal(props.data.puzzle);
  const href = useSignal(props.url.href);
  const mode = useSignal<"replay">("replay");

  const url = new URL(props.req.url);

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
        <Header url={url} items={navItems} />

        <h1 className="text-5 text-brand mt-2">
          {props.data.puzzle.name}
        </h1>

        <Board
          puzzle={puzzle}
          href={href}
          mode={mode}
        />
      </Main>

      {props.data.solutions.length
        ? (
          <SolutionsPanel
            puzzle={puzzle}
            solutions={props.data.solutions}
            solution={props.data.solution}
            href={href}
          />
        )
        : null}
    </>
  );
});
