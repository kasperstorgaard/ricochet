import { page, PageProps } from "fresh";

import { Header } from "#/components/header.tsx";
import { Main } from "#/components/main.tsx";
import { Pagination } from "#/components/pagination.tsx";
import { Panel } from "#/components/panel.tsx";
import { Thumbnail } from "#/components/thumbnail.tsx";
import { clsx } from "clsx/lite";
import { define } from "#/core.ts";
import { isDev } from "#/lib/env.ts";
import { listPuzzles } from "#/util/loader.ts";
import { PaginatedData, Puzzle } from "#/util/types.ts";
import { getPage } from "#/util/url.ts";

const ITEMS_PER_PAGE = 6;

type PageData = PaginatedData<Puzzle> & { locale: string };

export const handler = define.handlers<PageData>({
  async GET(ctx) {
    const { items, pagination } = await listPuzzles(ctx.url.origin, {
      sortBy: "createdAt",
      sortOrder: "descending",
      page: getPage(ctx.url),
      itemsPerPage: ITEMS_PER_PAGE,
    });

    const locale = ctx.req.headers.get("Accept-Language")?.split(",")[0] ??
      "en";

    return page({ items, pagination, locale });
  },
});

export default define.page(
  function PuzzlesPage(props: PageProps<PageData>) {
    const { items, pagination, locale } = props.data;

    const url = new URL(props.req.url);

    const navItems = [
      { name: "home", href: "/" },
      { name: "puzzles", href: "/puzzles" },
    ];

    return (
      <>
        <Main className="max-lg:row-span-full items-stretch place-content-stretch lg:pb-fl-4">
          <Header url={url} items={navItems} />

          <div className="flex items-center justify-between gap-fl-1 mt-2 -mb-1">
            <h1 className="text-5 text-brand">Puzzles</h1>

            {isDev && (
              <a href="/puzzles/new" className="btn">
                <i className="ph-plus ph" /> New
              </a>
            )}
          </div>

          <ul
            className={clsx(
              "p-0 grid grid-cols-[repeat(2,1fr)] gap-fl-1 gap-x-fl-2",
              "md:grid-cols-[repeat(3,1fr)] max-lg:max-w-120",
            )}
          >
            {items.map((puzzle) => (
              <li className="list-none pl-0 min-w-0" key={puzzle.slug}>
                <a
                  href={`puzzles/${puzzle.slug}`}
                  className={clsx(
                    "group flex flex-col gap-fl-1 text-text-1",
                    "hover:text-brand hover:no-underline",
                  )}
                >
                  <div
                    className={clsx(
                      "flex border-1 border-surface-4",
                      "group-hover:border-brand transition-colors",
                    )}
                  >
                    <Thumbnail
                      board={puzzle.board}
                      class="basis-0 grow aspect-square h-full"
                    />
                  </div>

                  <div className="flex flex-col">
                    <time
                      dateTime={puzzle.createdAt.toISOString()}
                      className="text-0 text-text-2 group-hover:text-current uppercase tracking-wide leading-flat"
                    >
                      {new Intl.DateTimeFormat(locale, {
                        dateStyle: "short",
                      }).format(puzzle.createdAt)}
                    </time>

                    <span className="flex flex-wrap text-2 leading-tight font-4">
                      {puzzle.name}
                    </span>
                  </div>
                </a>
              </li>
            ))}
          </ul>

          <Pagination
            {...pagination}
            baseUrl={props.url.href}
            className="mt-fl-1 max-sm:mb-fl-1 max-sm:mt-fl-3"
          />
        </Main>

        <Panel>
          <span />
        </Panel>
      </>
    );
  },
);
