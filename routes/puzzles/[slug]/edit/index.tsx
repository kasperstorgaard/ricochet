import { useSignal } from "@preact/signals";
import { page, PageProps } from "fresh";

import { Header } from "#/components/header.tsx";
import { Main } from "#/components/main.tsx";
import Board from "#/islands/board.tsx";
import { EditorPanel } from "#/islands/editor-panel.tsx";
import { define } from "#/core.ts";
import { getPuzzle } from "#/util/loader.ts";
import { Puzzle } from "#/util/types.ts";

export const handler = define.handlers<Puzzle>({
  async GET(ctx) {
    const { slug } = ctx.params;

    const puzzle = await getPuzzle(ctx.url.origin, slug);

    if (!puzzle) {
      throw new Error(`Unable to find puzzle with slug: ${slug}`);
    }

    return page(puzzle);
  },
});

export default define.page(function EditorPage(props: PageProps<Puzzle>) {
  const slug = props.data.slug;
  const puzzle = useSignal(props.data);
  const href = useSignal(props.url.href);
  const mode = useSignal<"editor">("editor");

  const navItems = [
    { name: "home", href: "/" },
    { name: "puzzles", href: "/puzzles" },
    { name: slug, href: "/puzzles/" + slug },
    { name: "edit", href: "/puzzles/" + slug + "/edit" },
  ];

  return (
    <>
      <Main>
        <Header items={navItems} />

        <h1 className="text-5 text-brand">Edit</h1>

        <Board
          puzzle={puzzle}
          href={href}
          mode={mode}
        />
      </Main>

      <EditorPanel puzzle={puzzle} href={href} />
    </>
  );
});
