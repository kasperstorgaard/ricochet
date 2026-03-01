import { type Signal } from "@preact/signals";
import { useMemo } from "preact/hooks";

import { isValidSolution, resolveMoves } from "#/game/board.ts";
import { Puzzle } from "#/game/types.ts";
import { decodeState, getResetHref } from "#/game/url.ts";
import { Dialog } from "#/islands/dialog.tsx";

type Props = {
  href: Signal<string>;
  puzzle: Signal<Puzzle>;
  isPreview?: boolean;
};

export function SolutionDialog({ href, puzzle, isPreview }: Props) {
  const state = useMemo(() => decodeState(href.value), [href.value]);

  const moves = useMemo(
    () => state.moves.slice(0, state.cursor ?? state.moves.length),
    [
      state.moves,
      state.cursor,
    ],
  );

  const board = useMemo(() => resolveMoves(puzzle.value.board, moves), [
    puzzle.value.board,
    moves,
  ]);

  const hasSolution = useMemo(() => isValidSolution(board), [board]);

  return (
    <Dialog open={hasSolution}>
      <h2 className="text-3 lg:text-fl-1">You found a solution!</h2>

      {!isPreview && (
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
              required
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
            disabled={!hasSolution}
          >
            Submit solution
          </button>
        </form>
      )}

      {isPreview && (
        <p className="text-text-2">
          <em>Solutions cannot be submitted for previews</em>
        </p>
      )}

      <div>
        {!isPreview && (
          <>
            Not satisfied?<br />
          </>
        )}

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
            disabled={!hasSolution}
          >
            close
          </button>
        </form>
      </div>
    </Dialog>
  );
}
