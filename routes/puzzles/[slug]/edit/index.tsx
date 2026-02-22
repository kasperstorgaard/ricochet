import { useSignal } from "@preact/signals";
import { HttpError, page } from "fresh";

import { Header } from "#/components/header.tsx";
import { Main } from "#/components/main.tsx";
import Board from "#/islands/board.tsx";
import { EditableName } from "#/islands/editable-name.tsx";
import { EditorPanel } from "#/islands/editor-panel.tsx";
import { SolutionBadge } from "#/islands/solution-badge.tsx";
import { define } from "#/core.ts";
import { isDev } from "#/lib/env.ts";
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
});

// TODO: if on localhost, save directly to disc
export default define.page<typeof handler>(function EditorPage(props) {
  const slug = props.data.slug;
  const puzzle = useSignal(props.data);
  const href = useSignal(props.url.href);
  const mode = useSignal<"editor">("editor");

  const url = new URL(props.req.url);

  const navItems = [
    { name: "home", href: "/" },
    { name: "puzzles", href: "/puzzles" },
    { name: slug, href: "/puzzles/" + slug },
    { name: "edit", href: "/puzzles/" + slug + "/edit" },
  ];

  return (
    <>
      <Main>
        <Header url={url} items={navItems} />

        <div className="flex justify-between gap-fl-2 place-self-start items-center w-full mt-2">
          <div className="flex flex-col">
            <EditableName
              puzzle={puzzle}
              defaultValue={slug}
              className="text-5 text-brand pr-1 leading-tight"
            />
            <p className="pl-1 text-fl-0 text-text-2 leading-tight">edit</p>
          </div>
          <SolutionBadge puzzle={puzzle} />
        </div>

        <Board
          puzzle={puzzle}
          href={href}
          mode={mode}
        />
      </Main>

      <EditorPanel puzzle={puzzle} href={href} isDev={isDev} />
    </>
  );
});
