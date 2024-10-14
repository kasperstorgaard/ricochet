import { Puzzle } from "#/db/types.ts";
import type { Signal } from "@preact/signals";
import { cn } from "#/lib/style.ts";
import { useMemo } from "preact/hooks";
import { decodeState } from "#/util/url.ts";
import { getResetHref } from "#/util/game.ts";

type Props = {
  isOpen: Signal<boolean>;
  href: Signal<string>;
  puzzle: Signal<Puzzle>;
};

export function SolutionDialog({ isOpen, href, puzzle }: Props) {
  const state = useMemo(() => decodeState(href.value), [href.value]);

  return (
    <dialog open={isOpen.value}>
      <div
        className={cn(
          "grid max-w-screen-md gap-3",
          "md:aspect-golden p-3",
          "backdrop:bg-gray-9 backdrop:opacity-55",
        )}
      >
        <h2 className="text-4">You found a solution!</h2>

        <form
          className="grid gap-fl-2"
          action={puzzle.value.id}
          method="post"
        >
          <label className="flex flex-col gap-1">
            What name/username do you want to use?

            <input
              name="name"
              autocomplete="username name"
              value="jungleboi"
              className="border-1 border-gray-0 p-2 bg-none text-2 text-gray-0"
            />
          </label>

          <input
            type="hidden"
            name="moves"
            value={JSON.stringify(state.moves)}
          />

          <button
            className="place-self-start px-2 py-1 rounded-2 bg-cyan-8"
            type="submit"
          >
            Submit solution
          </button>
        </form>

        <p>
          Not satisfied?<br />
          <a
            href={getResetHref(href.value)}
            className="underline text-purple-2"
          >
            Start over
          </a>{" "}
          <em>or</em>{" "}
          <form method="dialog" className="inline">
            <button className="underline text-purple-2" formnovalidate>
              close
            </button>
          </form>
        </p>
      </div>
    </dialog>
  );
}
