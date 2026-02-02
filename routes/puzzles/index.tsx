import { Puzzle } from "#/util/types.ts";
import { page, PageProps } from "fresh";
import { listPuzzles } from "#/util/loader.ts";
import { Header } from "#/components/header.tsx";
import { Main } from "#/components/main.tsx";
import { Thumbnail } from "../../components/thumbnail.tsx";
import { cn } from "#/lib/style.ts";
import { Panel } from "#/components/panel.tsx";
import { define } from "../core.ts";

export const handler = define.handlers<Puzzle[]>({
  async GET(ctx) {
    const puzzles = await listPuzzles(ctx.url.origin, { limit: 6 });
    return page(puzzles);
  },
});

export default define.page(function PuzzlesPage(props: PageProps<Puzzle[]>) {
  const navItems = [
    { name: "home", href: "/" },
  ];

  return (
    <>
      <Main>
        <Header items={navItems} />

        <h1 className="text-5 text-brand">Puzzles</h1>

        {/* TODO: add pagination */}
        <ul
          className={cn(
            "grid grid-cols-[repeat(2,1fr)] gap-fl-3 py-fl-2",
            "sm:grid-cols-[repeat(3,1fr)]",
          )}
        >
          {props.data.filter((item) => item.slug).map((puzzle) => (
            <li className="list-none pl-0 min-w-0">
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

                <span className="text-fl-0 font-3 group-hover:text-brand transition-colors">
                  {puzzle.name}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </Main>

      <Panel>
        {/* TODO: chuck some links in here */}
        <span />
      </Panel>
    </>
  );
});
