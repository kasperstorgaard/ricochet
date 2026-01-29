import { useSignal } from "@preact/signals";
import { Puzzle } from "#/db/types.ts";
import Board from "#/islands/board.tsx";
import { EditorPanel } from "#/islands/editor-panel.tsx";
import { Handlers, PageProps } from "$fresh/server.ts";
import { Header } from "#/components/header.tsx";

export const handler: Handlers<Puzzle> = {
  GET(_req, ctx) {
    return ctx.render({
      name: "",
      slug: "",
      board: {
        destination: { x: 0, y: 0 },
        pieces: [],
        walls: [],
      },
    });
  },
};

export default function EditorPage(props: PageProps<Puzzle>) {
  const puzzle = useSignal(props.data);
  const href = useSignal(props.url.href);
  const mode = useSignal<"editor">("editor");

  const navItems = [
    { name: "home", href: "/" },
    { name: "puzzles", href: "/puzzles/" },
    { name: "new", href: "/puzzles/new/" },
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
}
