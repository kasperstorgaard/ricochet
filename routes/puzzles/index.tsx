import { Puzzle } from "#/db/types.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { listPuzzles } from "#/util/loader.ts";
import { Header } from "#/components/header.tsx";

export const handler: Handlers<Puzzle[]> = {
  async GET(_req, ctx) {
    const puzzles = await listPuzzles();
    return ctx.render(puzzles);
  },
};

export default function PuzzlesPage(props: PageProps<Puzzle[]>) {
  const navItems = [
    { name: "home", href: "/" },
  ];

  return (
    <div class="flex flex-col col-[2/3] w-full gap-fl-2 pt-fl-2">
      <Header items={navItems} />

      <h1 className="text-5 text-brand">Recent puzzles</h1>

      <ul className="grid gap-1 py-fl-2">
        {props.data.filter((item) => item.slug).map((puzzle) => (
          <li className="flex gap-fl-2 pl-0">
            <a href={`puzzles/${puzzle.slug}`} className="underline">
              {puzzle.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
