import type { Signal } from "@preact/signals";
import { useEffect, useMemo, useRef } from "preact/hooks";

import { cn } from "#/lib/style.ts";
import { Puzzle } from "#/util/types.ts";
import { decodeState, getResetHref } from "#/util/url.ts";

type Props = {
  href: Signal<string>;
  puzzle: Signal<Puzzle>;
  open?: boolean;
};

export function SolutionDialog({ open, href, puzzle }: Props) {
  const state = useMemo(() => decodeState(href.value), [href.value]);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    ref.current?.close();

    if (open) ref.current?.showModal();
  }, [open]);

  return (
    <dialog
      ref={ref}
      open={open}
      className={cn(
        "m-auto rounded-1 opacity-0 open:opacity-100 transition-opacity duration-500 z-5",
        "backdrop:bg-surface-1",
      )}
    >
      <div className="grid gap-fl-2 p-fl-3">
        <h2 className="text-4">You found a solution!</h2>

        <form
          className="grid gap-fl-3"
          action={puzzle.value.slug}
          method="post"
        >
          <label className="flex flex-col gap-1">
            <span className="text-text-2 text-1">
              What name/username do you want to use?
            </span>

            <input
              name="name"
              autocomplete="username name"
              placeholder="fx. Jungleboi87"
              className="border border-none p-2 bg-none text-2 rounded-1"
            />
          </label>

          <input
            type="hidden"
            name="moves"
            value={JSON.stringify(state.moves)}
          />

          <button
            className="place-self-start px-2 py-1 rounded-1 bg-ui-3"
            type="submit"
          >
            Submit solution
          </button>
        </form>

        <div>
          Not satisfied?<br />
          <a
            href={getResetHref(href.value)}
            className="underline text-ui-4"
          >
            start over
          </a>{" "}
          <em>or</em>{" "}
          <form method="dialog" className="inline">
            <button
              type="submit"
              className="underline text-ui-4"
              formnovalidate
            >
              close
            </button>
          </form>
        </div>
      </div>
    </dialog>
  );
}
