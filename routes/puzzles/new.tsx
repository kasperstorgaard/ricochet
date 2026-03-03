import { useSignal } from "@preact/signals";
import { clsx } from "clsx/lite";
import { page } from "fresh";

import { Header } from "#/components/header.tsx";
import { Main } from "#/components/main.tsx";
import { define } from "#/core.ts";
import { getStoredPuzzle } from "#/game/cookies.ts";
import type { Puzzle } from "#/game/types.ts";
import Board from "#/islands/board.tsx";
import { DifficultyBadge } from "#/islands/difficulty-badge.tsx";
import { EditableName } from "#/islands/editable-name.tsx";
import { EditorAutosave } from "#/islands/editor-autosave.tsx";
import { EditorKeyboardShortcuts } from "#/islands/editor-keyboard-shortcuts.tsx";
import { EditorPanel } from "#/islands/editor-panel.tsx";
import { EditorToolbar } from "#/islands/editor-toolbar.tsx";
import { isDev } from "#/lib/env.ts";

export const handler = define.handlers<Puzzle>({
  GET(ctx) {
    let puzzle: Puzzle | null = null;

    try {
      puzzle = getStoredPuzzle(ctx.req.headers);
    } catch {
      // swallow parsing errors for now
    }

    if (!puzzle) {
      puzzle = {
        name: "Untitled",
        slug: "untitled",
        createdAt: new Date(Date.now()),
        difficulty: "medium",
        board: {
          destination: { x: 0, y: 0 },
          pieces: [],
          walls: [],
        },
      };
    }

    return page(puzzle);
  },
});

export default define.page<typeof handler>(function EditorPage(props) {
  const puzzle = useSignal(props.data);
  const href = useSignal(props.url.href);
  const mode = useSignal<"editor">("editor");

  const url = new URL(props.req.url);

  return (
    <>
      <Main className="lg:relative">
        <Header url={url} back={{ href: "/" }} themePicker />

        <div className="flex justify-between items-center gap-fl-1 mt-2">
          <div className="flex flex-col group">
            <EditableName
              puzzle={puzzle}
              defaultValue="Untitled"
              className="text-5 text-brand pr-1 leading-tight"
            />

            <p
              className={clsx(
                "text-fl-0 text-text-3 leading-tight italic -mb-[.6lh] -mt-[.4lh]",
                "group-focus-within:opacity-0 transition-opacity",
              )}
            >
              new
            </p>
          </div>

          <DifficultyBadge puzzle={puzzle} showMinMoves className="lg:mt-1" />
        </div>

        <div className="relative max-lg:pb-fl-5 lg:pb-0">
          <Board
            puzzle={puzzle}
            href={href}
            mode={mode}
            className="lg:col-[1/2] lg:row-[4/5]"
          />

          <EditorToolbar
            puzzle={puzzle}
            href={href}
            className={clsx(
              "absolute",
              "max-lg:bottom-0 max-lg:left-1/2 max-lg:-translate-x-1/2",
              "lg:ml-fl-1 lg:left-full lg:top-1/2 lg:-translate-y-1/2",
            )}
          />
        </div>
      </Main>
      <EditorPanel puzzle={puzzle} href={href} isDev={isDev} />
      <EditorAutosave puzzle={puzzle} />
      <EditorKeyboardShortcuts puzzle={puzzle} href={href} />
    </>
  );
});
