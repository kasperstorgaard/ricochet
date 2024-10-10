import { Puzzle } from "#/db/types.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { listPuzzles } from "#/db/kv.ts";

export const handler: Handlers<Puzzle[]> = {
  async GET(_req, ctx) {
    let page: number | undefined = parseInt(
      ctx.url.searchParams.get("page") ?? "",
    );
    if (isNaN(page)) page = undefined;

    let limit: number | undefined = parseInt(
      ctx.url.searchParams.get("limit") ?? "",
    );
    if (isNaN(limit)) limit = undefined;

    const puzzles = await listPuzzles({ limit, page });
    return ctx.render(puzzles);
  },
};

export default function PuzzleList(props: PageProps<Puzzle[]>) {
  return (
    <div class="flex flex-col col-[2/3] w-full gap-fl-2 py-1">
      <h1 className="text-fl-2">Recent puzzles</h1>

      <ul className="grid gap-3">
        {props.data.filter((item) => item.id).map((puzzle) => (
          <li className="flex gap-2 pl-0">
            <a href={`/${puzzle.id}`} className="underline">
              {puzzle.name}
            </a>
            <a
              href={`/editor/${puzzle.id}`}
              className="underline px-2 rounded-3 border-1 border-purple-2 text-purple-4"
            >
              edit
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
