import { Board } from "#/db/types.ts";
import type { Signal } from "@preact/signals";

type EditorPanelProps = {
  state: Signal<Board>;
};

export function EditorPanel({ state }: EditorPanelProps) {
  return (
    <aside className="col-span-3 grid grid-cols-subgrid p-3 border-t-2 border-violet-3 bg-gray-7">
      <form
        className="col-[2/3] grid gap-3"
        method="post"
      >
        <label className="flex flex-col gap-1 text-0">
          Puzzle name
          <input name="name" className="border-1 border-gray-0 p-2 bg-none" />
        </label>

        <input type="hidden" name="board" value={JSON.stringify(state.value)} />

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
