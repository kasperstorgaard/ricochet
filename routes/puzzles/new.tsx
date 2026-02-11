import { useSignal } from "@preact/signals";
import { page, PageProps } from "fresh";

import { Header } from "#/components/header.tsx";
import Board from "#/islands/board.tsx";
import { EditableName } from "#/islands/editable-name.tsx";
import { EditorPanel } from "#/islands/editor-panel.tsx";
import { define } from "#/core.ts";
import { isDev } from "#/lib/env.ts";
import { Puzzle } from "#/util/types.ts";
import { Main } from "../../components/main.tsx";

export const handler = define.handlers<Puzzle>({
  GET() {
    return page({
      name: "Untitled",
      slug: "untitled",
      createdAt: new Date(Date.now()),
      board: {
        destination: { x: 0, y: 0 },
        pieces: [],
        walls: [],
      },
    });
  },
});

export default define.page(function EditorPage(props: PageProps<Puzzle>) {
  const puzzle = useSignal(props.data);
  const href = useSignal(props.url.href);
  const mode = useSignal<"editor">("editor");

  const url = new URL(props.req.url);

  const navItems = [
    { name: "home", href: "/" },
    { name: "puzzles", href: "/puzzles" },
    { name: "new", href: "/puzzles/new" },
  ];

  return (
    <>
      <Main>
        <Header url={url} items={navItems} />

        <EditableName
          puzzle={puzzle}
          defaultValue="Untitled"
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
