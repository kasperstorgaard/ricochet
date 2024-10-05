import { Puzzle } from "#/db/types.ts";
import type { Signal } from "@preact/signals";
import { useMemo } from "preact/hooks";
import { encodeState } from "#/util/url.ts";

type EditorPanelProps = {
  href: Signal<string>;
  puzzle: Signal<Puzzle>;
};

export function EditorPanel({ puzzle, href }: EditorPanelProps) {
  const state = useMemo(() => {
    const url = new URL(href.value);
    url.search = encodeState({
      ...puzzle.value.board,
      moves: [],
    });
    return url.href;
  }, [href.value, puzzle.value.board]);

  return (
    <aside className="col-span-3 grid grid-cols-subgrid p-3 border-t-2 border-violet-3 bg-gray-7 text-fl-0">
      <form
        className="col-[2/3] grid gap-fl-2"
        method="post"
      >
        <label className="flex flex-col gap-1">
          Puzzle name
          <input
            name="name"
            value={puzzle.value.name}
            className="border-1 border-gray-0 p-2 bg-none text-fl-1"
          />
        </label>

        <input type="hidden" name="board" value={JSON.stringify(state)} />

        <button
          className="place-self-start px-2 py-1 rounded-2 bg-cyan-8"
          type="submit"
        >
          submit
        </button>
      </form>
    </aside>
  );
}
