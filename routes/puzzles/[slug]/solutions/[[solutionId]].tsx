import { useSignal } from "@preact/signals";
import { HttpError, page } from "fresh";

import { Header } from "#/components/header.tsx";
import { Main } from "#/components/main.tsx";
import { define } from "#/core.ts";
import { getPuzzleSolution, listPuzzleSolutions } from "#/db/kv.ts";
import { Solution } from "#/db/types.ts";
import { getPuzzle } from "#/game/loader.ts";
import { Puzzle } from "#/game/types.ts";
import { encodeState } from "#/game/url.ts";
import Board from "#/islands/board.tsx";
import { DifficultyBadge } from "#/islands/difficulty-badge.tsx";
import { SolutionsPanel } from "#/islands/solutions-panel.tsx";

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

    if (solutionId && !solution) {
      throw new HttpError(
        404,
        `Unable to find solution with id: ${solutionId}`,
      );
    }

    const url = new URL(req.url);
    if (!url.searchParams.has("moves") && solution) {
      url.search = encodeState(solution);

      return Response.redirect(url, 303);
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
  const showMinMoves = props.state.featureFlags.minMoves ?? false;

  const url = new URL(props.req.url);

  return (
    <>
      <Main>
        <div>
          <Header url={url} back={{ href: `/puzzles/${props.data.puzzle.slug}` }} />
        </div>

        <div className="flex items-center justify-between place-self-start mt-2 w-full flex-wrap">
          <div className="flex flex-col">
            <h1 className="text-5 text-brand leading-tight">
              {props.data.puzzle.name}
            </h1>

            <p className="text-fl-0 text-text-3 leading-tight italic -mb-[.6lh] -mt-[.4lh]">
              solutions
            </p>
          </div>

          <DifficultyBadge
            puzzle={puzzle}
            showMinMoves={showMinMoves}
            className="lg:mt-1"
          />
        </div>

        <Board
          puzzle={puzzle}
          href={href}
          mode={mode}
        />
      </Main>

      <SolutionsPanel
        puzzle={puzzle}
        solutions={props.data.solutions}
        solution={props.data.solution}
        href={href}
      />
    </>
  );
});
