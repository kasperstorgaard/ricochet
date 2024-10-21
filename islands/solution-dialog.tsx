import { Puzzle } from "#/db/types.ts";
import type { Signal } from "@preact/signals";
import { cn } from "#/lib/style.ts";
import { type Ref, useMemo } from "preact/hooks";
import { decodeState } from "#/util/url.ts";
import { getResetHref } from "#/util/game.ts";
import { forwardRef } from "preact/compat";

type Props = {
  ref: Ref<HTMLDialogElement>;
  open: boolean;
  href: Signal<string>;
  puzzle: Signal<Puzzle>;
};

export const SolutionDialog = forwardRef<HTMLDialogElement, Props>(
  function ({ open, href, puzzle }, ref) {
    const state = useMemo(() => decodeState(href.value), [href.value]);

    return (
      <dialog
        ref={ref}
        open={open || undefined}
        className={cn(
          "rounded-1 backdrop:bg-surface-1 opacity-0 open:opacity-100 transition-opacity duration-500",
        )}
      >
        <div
          className={cn(
            "grid max-w-screen-lg gap-fl-2",
            "md:aspect-golden p-fl-2",
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
                placeholder="fx. Jungleboi87"
                className="border-1 border-gray-0 p-2 bg-none text-2 rounded-1"
              />
            </label>

            <input
              type="hidden"
              name="moves"
              value={JSON.stringify(state.moves)}
            />

            <button
              className="place-self-start px-2 py-1 rounded-1 bg-ui-3 -mt-fl-1"
              type="submit"
            >
              Submit solution
            </button>
          </form>

          <p>
            Not satisfied?<br />
            <a
              href={getResetHref(href.value)}
              className="underline text-ui-4"
            >
              start over
            </a>{" "}
            <em>or</em>{" "}
            <form method="dialog" className="inline">
              <button className="underline text-ui-4" formnovalidate>
                close
              </button>
            </form>
          </p>
        </div>
      </dialog>
    );
  },
);
