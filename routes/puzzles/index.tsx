import { clsx } from "clsx/lite";
import { page } from "fresh";

import { Header } from "#/components/header.tsx";
import { Main } from "#/components/main.tsx";
import { Pagination } from "#/components/pagination.tsx";
import { Panel } from "#/components/panel.tsx";
import { PuzzleCard } from "#/components/puzzle-card.tsx";
import { define } from "#/core.ts";
import { listPuzzles } from "#/game/loader.ts";
import { PaginatedData, Puzzle } from "#/game/types.ts";
import { getPage } from "#/game/url.ts";
import { getCompletedSlugs } from "../../game/cookies.ts";

const ITEMS_PER_PAGE = 6;

type PageData = PaginatedData<Puzzle> & {
  latestCreatedAt: Date;
  completedSlugs: string[];
};

export const handler = define.handlers<PageData>({
  async GET(ctx) {
    const currentPage = getPage(ctx.url) ?? 1;

    const latestCreatedAtPromise = listPuzzles(ctx.url.origin, {
      sortBy: "createdAt",
      sortOrder: "descending",
      page: 1,
      itemsPerPage: 1,
    }).then((res) => res.items[0].createdAt);

    const puzzlesPromise = listPuzzles(ctx.url.origin, {
      sortBy: "createdAt",
      sortOrder: "descending",
      page: currentPage,
      itemsPerPage: ITEMS_PER_PAGE,
    });

    const [{ items, pagination }, latestCreatedAt] = await Promise.all([
      puzzlesPromise,
      latestCreatedAtPromise,
    ]);
    const completedSlugs = getCompletedSlugs(ctx.req.headers);

    return page({
      items,
      pagination,
      latestCreatedAt,
      completedSlugs,
    });
  },
});

export default define.page<typeof handler>(
  function PuzzlesPage(props) {
    const { items, pagination, latestCreatedAt, completedSlugs } = props.data;

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
                  completed={completedSlugs.includes(puzzle.slug)}
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

            <div className="flex flex-col gap-0">
              <span className="text-fl-2 text-brand leading-flat font-4">
                {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
                  latestCreatedAt,
                )}
              </span>
              <span className="text-fl-0 text-text-2">
                Latest batch
              </span>
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
              Build a puzzle
            </a>
          </div>
        </Panel>
      </>
    );
  },
);
