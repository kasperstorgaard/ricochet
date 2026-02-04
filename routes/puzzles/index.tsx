import { page, PageProps } from "fresh";

import { Header } from "#/components/header.tsx";
import { Main } from "#/components/main.tsx";
import { Pagination } from "#/components/pagination.tsx";
import { Panel } from "#/components/panel.tsx";
import { Thumbnail } from "#/components/thumbnail.tsx";
import { cn } from "#/lib/style.ts";
import { define } from "#/routes/core.ts";
import { listPuzzles } from "#/util/loader.ts";
import { PaginatedData, Puzzle } from "#/util/types.ts";
import { getPage } from "#/util/url.ts";

const ITEMS_PER_PAGE = 6;

export const handler = define.handlers<PaginatedData<Puzzle>>({
  async GET(ctx) {
    const { items, pagination } = await listPuzzles(ctx.url.origin, {
      page: getPage(ctx.url),
      itemsPerPage: ITEMS_PER_PAGE,
    });

    return page({ items, pagination });
  },
});

export default define.page(
  function PuzzlesPage(props: PageProps<PaginatedData<Puzzle>>) {
    const { items, pagination } = props.data;
    const navItems = [
      { name: "home", href: "/" },
    ];

    return (
      <>
        <Main className="max-lg:row-span-full place-content-stretch lg:pb-fl-4">
          <Header items={navItems} />

          <h1 className="text-5 text-brand">Puzzles</h1>

          <ul
            className={cn(
              "grid grid-cols-[repeat(2,1fr)] gap-fl-3",
              "sm:grid-cols-[repeat(3,1fr)]",
            )}
          >
            {items.map((puzzle) => (
              <li className="list-none pl-0 min-w-0" key={puzzle.slug}>
                <a
                  href={`puzzles/${puzzle.slug}`}
                  className="flex flex-col gap-1 group"
                >
                  <div
                    className={cn(
                      "flex overflow-hidden rounded-2 border-1 border-surface-4",
                      "group-hover:border-brand transition-colors",
                    )}
                  >
                    <Thumbnail
                      board={puzzle.board}
                      class="basis-0 grow aspect-square h-full"
                    />
                  </div>

                  <span className="flex flex-wrap text-fl-0 font-3 group-hover:text-brand transition-colors">
                    {puzzle.name}
                  </span>
                </a>
              </li>
            ))}
          </ul>

          <Pagination {...pagination} baseUrl={props.url.href} />
        </Main>

        <Panel>
          <span />
        </Panel>
      </>
    );
  },
);
