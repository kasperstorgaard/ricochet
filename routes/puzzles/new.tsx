import { useSignal } from "@preact/signals";
import { page, PageProps } from "fresh";

import { Header } from "#/components/header.tsx";
import Board from "#/islands/board.tsx";
import { EditorPanel } from "#/islands/editor-panel.tsx";
import { define } from "#/routes/core.ts";
import { Puzzle } from "#/util/types.ts";

export const handler = define.handlers<Puzzle>({
  GET() {
    return page({
      name: "",
      slug: "",
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

  const navItems = [
    { name: "home", href: "/" },
    { name: "puzzles", href: "/puzzles" },
    { name: "new", href: "/puzzles/new" },
  ];

  return (
    <>
      <div class="flex flex-col col-[2/3] w-full gap-fl-2 pt-fl-2">
        <Header items={navItems} />

        <h1 className="text-5 text-brand">New puzzle</h1>

        <Board
          puzzle={puzzle}
          href={href}
          mode={mode}
        />
      </div>

      <EditorPanel puzzle={puzzle} href={href} />
    </>
  );
});
