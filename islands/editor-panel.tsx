import { Puzzle } from "#/db/types.ts";
import type { Signal } from "@preact/signals";
import { useMemo } from "preact/hooks";
import { decodeState, encodeState } from "#/util/url.ts";
import { resolveMoves } from "#/util/board.ts";

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

  return (
    <aside className="col-span-3 grid grid-cols-subgrid py-fl-3 border-t-2 border-brand bg-surface-2 text-fl-0">
      <form
        className="col-[2/3] grid gap-fl-2"
        method="post"
      >
        <label className="flex flex-col gap-1">
          Name

          <input
            name="name"
            value={puzzle.value.name}
            className="border-1 rounded-1 border-gray-0 p-2 bg-none"
            onKeyUp={(event) => event.stopPropagation()}
          />
        </label>

        <input
          type="hidden"
          name="board"
          value={JSON.stringify(board)}
        />

        <button
          className="place-self-start px-2 py-1 rounded-1 bg-ui-3"
          type="submit"
        >
          Create puzzle
        </button>
      </form>
    </aside>
  );
}
