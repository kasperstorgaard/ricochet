import type { Signal } from "@preact/signals";
import { useMemo } from "preact/hooks";

import { Dialog } from "#/islands/dialog.tsx";
import { Puzzle } from "#/util/types.ts";
import { decodeState, getResetHref } from "#/util/url.ts";

type Props = {
  href: Signal<string>;
  puzzle: Signal<Puzzle>;
  open?: boolean;
};

export function SolutionDialog({ open, href, puzzle }: Props) {
  const state = useMemo(() => decodeState(href.value), [href.value]);

  return (
    <Dialog open={open}>
      <h2 className="text-fl-1">You found a solution!</h2>

      <form
        className="grid gap-fl-2"
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
          className="btn place-self-start"
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
            className="underline text-ui-4 bg-transparent"
            formNoValidate
          >
            close
          </button>
        </form>
      </div>
    </Dialog>
  );
}
