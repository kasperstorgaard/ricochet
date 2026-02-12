import { useSignal } from "@preact/signals";
import { HttpError, page } from "fresh";

import { Header } from "#/components/header.tsx";
import { Main } from "#/components/main.tsx";
import { define } from "#/core.ts";
import { addSolution } from "#/db/kv.ts";
import Board from "#/islands/board.tsx";
import { ControlsPanel } from "#/islands/controls-panel.tsx";
import { SolutionBadge } from "#/islands/solution-badge.tsx";
import { isDev } from "#/lib/env.ts";
import { isValidSolution, resolveMoves } from "#/util/board.ts";
import { getPuzzle } from "#/util/loader.ts";
import { Puzzle } from "#/util/types.ts";

export const handler = define.handlers<Puzzle>({
  async GET(ctx) {
    const { slug } = ctx.params;

    const puzzle = await getPuzzle(ctx.url.origin, slug);
    if (!puzzle) {
      throw new HttpError(404, `Unable to find puzzle with slug: ${slug}`);
    }

    return page(puzzle);
  },
  async POST(ctx) {
    const req = ctx.req;
    const { slug } = ctx.params;

    const form = await req.formData();
    const name = form.get("name")?.toString();

    const puzzle = await getPuzzle(ctx.url.origin, slug);
    if (!puzzle) {
      throw new HttpError(404, `Unable to find puzzle with slug: ${slug}`);
    }

    if (!name) throw new HttpError(400, "Must provide a username");

    const rawMoves = form.get("moves")?.toString() ?? "";
    const moves = JSON.parse(rawMoves);

    if (!isValidSolution(resolveMoves(puzzle.board, moves))) {
      throw new HttpError(400, "Solution is not valid");
    }

    const solution = await addSolution({ puzzleSlug: slug, name, moves });
    const url = new URL(req.url);
    url.pathname = `puzzles/${slug}/solutions/${solution.id}`;

    return Response.redirect(url.href, 302);
  },
});

export default define.page<typeof handler>(function PuzzleDetails(props) {
  const href = useSignal(props.url.href);
  const puzzle = useSignal(props.data);
  const mode = useSignal<"solve">("solve");

  const showDifficulty = props.state.featureFlags.difficultyBadge ?? false;

  const url = new URL(props.req.url);

  const navItems = [
    { name: "home", href: "/" },
    { name: "puzzles", href: "/puzzles" },
    { name: props.data.name, href: `/puzzles/${props.data.slug}` },
  ];

  return (
    <>
      <Main>
        <Header url={url} items={navItems} />

        <div className="flex items-center justify-between gap-fl-1 mt-2 flex-wrap">
          <h1 className="text-5 text-brand">
            {props.data.name}
          </h1>

          <div className="flex gap-fl-1">
            {isDev &&
              (
                <a href={`/puzzles/${props.data.slug}/edit`} className="btn">
                  <i className="ph-pencil-simple ph" /> Edit
                </a>
              )}

            {showDifficulty && <SolutionBadge puzzle={puzzle} />}
          </div>
        </div>

        <Board href={href} puzzle={puzzle} mode={mode} />
      </Main>

      <ControlsPanel href={href} />
    </>
  );
});
