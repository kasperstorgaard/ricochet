import { Puzzle } from "#/db/types.ts";
import type { Signal } from "@preact/signals";
import { useMemo } from "preact/hooks";
import { decodeState, encodeState } from "#/util/url.ts";
import { resolveMoves } from "#/util/board.ts";
import { cn } from "#/lib/style.ts";
import { formatPuzzle } from "#/util/formatter.ts";

type EditorPanelProps = {
  href: Signal<string>;
  puzzle: Signal<Puzzle>;
};

export function EditorPanel({ puzzle, href }: EditorPanelProps) {
  const board = useMemo(() => {
    const url = new URL(href.value);
    url.search = encodeState({
      ...puzzle.value.board,
      moves: [],
    });

    const state = decodeState(url.href);
    const moves = state.moves.slice(0, state.cursor ?? state.moves.length);

    return resolveMoves(puzzle.value.board, moves);
  }, [href.value, puzzle.value.board]);

  const formatted = useMemo(() =>
    formatPuzzle({
      name: puzzle.value.name,
      slug: puzzle.value.slug,
      board,
    }), [puzzle.value, board]);

  return (
    <aside
      className={cn(
        "col-span-3 grid grid-cols-subgrid place-content-start py-fl-3",
        "border-t-2 border-brand bg-surface-2 text-fl-0",
      )}
    >
      <button
        className="place-self-end px-2 py-1 rounded-1 bg-ui-3 col-start-2"
        onClick={() => {
          navigator.clipboard.writeText(
            formatted,
          );
        }}
      >
        Copy puzzle
      </button>
    </aside>
  );
}
