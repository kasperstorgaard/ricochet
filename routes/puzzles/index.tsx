import { clsx } from "clsx/lite";
import { HttpError, page } from "fresh";

import { Header } from "#/components/header.tsx";
import { Icon, Pencil } from "#/components/icons.tsx";
import { Main } from "#/components/main.tsx";
import { Pagination } from "#/components/pagination.tsx";
import { Panel } from "#/components/panel.tsx";
import { PuzzleCard } from "#/components/puzzle-card.tsx";
import { define } from "#/core.ts";
import { getBestMoves, listUserSolutions } from "#/db/solutions.ts";
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

    const dailyPuzzle = await getLatestPuzzle();

    if (!dailyPuzzle) throw new HttpError(500, "Unable to get daily puzzle");

    const { items, pagination } = await listPuzzles({
      sortBy: "number",
      sortOrder: "descending",
      page: currentPage,
      excludeSlugs: ["tutorial", dailyPuzzle.slug],
      itemsPerPage: ITEMS_PER_PAGE,
    });

    const userSolutions = await listUserSolutions(ctx.state.userId, {
      limit: 500,
    });

    // TODO: use db filtering based on current page of items
    const bestMoves = getBestMoves(userSolutions);

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
        <Main
          className={clsx(
            "max-lg:row-span-full items-stretch place-content-stretch lg:pb-fl-4",
            "lg:max-w-xl lg:px-0",
          )}
        >
          <Header url={url} back={{ href: "/" }} share />

          <h1 className="text-brand text-6">Puzzle archives</h1>

          <ul
            className={clsx(
              "p-0 grid grid-cols-[repeat(2,1fr)] gap-x-fl-2 gap-y-fl-1",
              "md:grid-cols-[repeat(3,1fr)] max-md:max-w-120",
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
              <span className="text-5 text-brand leading-flat font-medium">
                {pagination.totalItems}
              </span>
              <span className="text-2 text-text-2">Puzzles</span>
            </div>
          </div>

          <div
            className={clsx(
              "col-[2/3] flex flex-col items-start text-2 text-text-2 mt-auto gap-fl-1",
              "lg:col-auto lg:row-start-3",
            )}
          >
            <span className="text-text-2 text-2">Feeling creative?</span>
            <a
              href="/puzzles/new"
              className="btn"
            >
              <Icon icon={Pencil} />
              Build a puzzle
            </a>
          </div>
        </Panel>
      </>
    );
  },
);
