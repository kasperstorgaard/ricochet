import { useSignal } from "@preact/signals";
import { HttpError, page, PageProps } from "fresh";

import { Header } from "#/components/header.tsx";
import { Main } from "#/components/main.tsx";
import Board from "#/islands/board.tsx";
import { EditableName } from "#/islands/editable-name.tsx";
import { EditorPanel } from "#/islands/editor-panel.tsx";
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
export default define.page(function EditorPage(props: PageProps<Puzzle>) {
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

        <EditableName
          puzzle={puzzle}
          defaultValue={slug}
          className="text-5 text-brand mt-2 place-self-start pr-1"
        />

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
