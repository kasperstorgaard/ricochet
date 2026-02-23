import { useSignal } from "@preact/signals";
import { page } from "fresh";

import { Header } from "#/components/header.tsx";
import { Main } from "#/components/main.tsx";
import { define } from "#/core.ts";
import Board from "#/islands/board.tsx";
import { EditableName } from "#/islands/editable-name.tsx";
import { EditorPanel } from "#/islands/editor-panel.tsx";
import { DifficultyBadge } from "../../islands/difficulty-badge.tsx";
import { isDev } from "#/lib/env.ts";
import { Puzzle } from "#/util/types.ts";

export const handler = define.handlers<Puzzle>({
  GET() {
    return page({
      name: "Untitled",
      slug: "untitled",
      createdAt: new Date(Date.now()),
      difficulty: "medium",
      board: {
        destination: { x: 0, y: 0 },
        pieces: [],
        walls: [],
      },
    });
  },
});

export default define.page<typeof handler>(function EditorPage(props) {
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

        <div className="w-full flex justify-between gap-fl-2 mt-2 place-self-start">
          <EditableName
            puzzle={puzzle}
            defaultValue="Untitled"
            className="text-5 text-brand pr-1"
          />

          <DifficultyBadge puzzle={puzzle} showMinMoves />
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
