import { clsx } from "clsx/lite";
import { HttpError, page } from "fresh";

import { Header } from "#/components/header.tsx";
import { Main } from "#/components/main.tsx";
import { Pagination } from "#/components/pagination.tsx";
import { Panel } from "#/components/panel.tsx";
import { PuzzleCard } from "#/components/puzzle-card.tsx";
import { define } from "#/core.ts";
import { listUserSolutions } from "#/db/solutions.ts";
import { getLatestPuzzle, listPuzzles } from "#/game/loader.ts";
import { PaginatedData, Puzzle } from "#/game/types.ts";
import { getPage } from "#/game/url.ts";

const ITEMS_PER_PAGE = 6;

type PageData = PaginatedData<Puzzle> & {
  bestMoves: Record<string, number>;
};

export const handler = define.handlers<PageData>({
  async GET(ctx) {
    const currentPage = getPage(ctx.url) ?? 1;

    const dailyPuzzle = await getLatestPuzzle(ctx.url.origin);

    if (!dailyPuzzle) throw new HttpError(500, "Unable to get daily puzzle");

    const { items, pagination } = await listPuzzles(ctx.url.origin, {
      sortBy: "number",
      sortOrder: "descending",
      page: currentPage,
      excludeSlugs: ["tutorial", dailyPuzzle.slug],
      itemsPerPage: ITEMS_PER_PAGE,
    });

    const userSolutions = await listUserSolutions(ctx.state.userId, {
      limit: 500,
    });

    const bestMoves: Record<string, number> = {};
    for (const s of userSolutions) {
      const current = bestMoves[s.puzzleSlug];
      if (current === undefined || s.moves.length < current) {
        bestMoves[s.puzzleSlug] = s.moves.length;
      }
    }

    return page({
      items,
      pagination,
      bestMoves,
    });
  },
});

export default define.page<typeof handler>(
  function PuzzlesPage(props) {
    const { items, pagination, bestMoves } = props.data;

    const url = new URL(props.req.url);

    return (
      <>
        <Main className="max-lg:row-span-full items-stretch place-content-stretch lg:pb-fl-4">
          <Header url={url} back={{ href: "/" }} share themePicker />

          <h1 className="text-5 text-brand -mb-fl-1">Puzzle archives</h1>

          <ul
            className={clsx(
              "p-0 grid grid-cols-[repeat(2,1fr)] gap-x-fl-2 gap-y-fl-1",
              "md:grid-cols-[repeat(3,1fr)] max-lg:max-w-120 max-lg:mt-fl-2",
            )}
          >
            {items.map((puzzle) => (
              <li className="list-none pl-0 min-w-0" key={puzzle.slug}>
                <PuzzleCard
                  puzzle={puzzle}
                  bestMoves={bestMoves[puzzle.slug]}
                />
              </li>
            ))}
          </ul>

          <Pagination
            {...pagination}
            baseUrl={props.url.href}
            className="max-sm:mb-fl-1 max-sm:mt-fl-3 self-start"
          />
        </Main>

        <Panel className="max-lg:gap-y-fl-2">
          <div
            className={clsx(
              "col-[2/3] flex flex-col gap-fl-2 items-start",
              "lg:col-auto lg:row-start-3",
            )}
          >
            <div className="flex flex-col gap-0">
              <span className="text-fl-3 text-brand leading-flat font-4">
                {pagination.totalItems}
              </span>
              <span className="text-fl-0 text-text-2">Puzzles</span>
            </div>
          </div>

          <div
            className={clsx(
              "col-[2/3] flex flex-col items-start text-fl-0 text-text-2 mt-auto gap-fl-1",
              "lg:col-auto lg:row-start-3",
            )}
          >
            <span className="text-text-2 text-fl-0">Feeling creative?</span>
            <a
              href="/puzzles/new"
              className="btn"
            >
              <i className="ph ph-pencil" />
              Build a puzzle
            </a>
          </div>
        </Panel>
      </>
    );
  },
);
