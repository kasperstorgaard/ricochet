import { type Signal } from "@preact/signals";
import clsx from "clsx/lite";
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
    [state.moves, state.cursor],
  );

  const board = useMemo(() => resolveMoves(puzzle.value.board, moves), [
    puzzle.value.board,
    moves,
  ]);

  const hasSolution = useMemo(() => isValidSolution(board), [board]);

  return (
    <Dialog open={hasSolution} className="max-w-md!">
      <div className="flex flex-col gap-fl-2 text-text-2">
        <h2 className="text-fl-2 leading-flat text-text-1">
          Solved in <span className="text-ui-2">{moves.length}</span>{" "}
          {moves.length === 1 ? "move" : "moves"}!
        </h2>

        {
          /* TODO: replace with a real stat once per-puzzle completion is tracked,
            e.g. "You did better than 73% of players on this puzzle." */
        }
        <p>
          Post your solution, see your rank and discover how others played it.
        </p>
      </div>

      {!isPreview && (
        <form
          id="solution"
          className="flex flex-col gap-fl-2"
          action={puzzle.value.slug}
          method="post"
        >
          <label className="flex flex-col gap-1">
            <span className="text-text-2 text-1">Name</span>

            <input
              name="name"
              autocomplete="name"
              placeholder="fx. Jungleboi87"
              required
              className="border border-surface-4 p-2 bg-surface-2 text-2 rounded-1"
            />
          </label>

          <input
            type="hidden"
            name="moves"
            value={JSON.stringify(state.moves)}
          />
        </form>
      )}

      {isPreview && (
        <p className="text-text-2">
          <em>Solutions cannot be submitted for previews</em>
        </p>
      )}

      <div className="flex gap-fl-2 justify-between flex-wrap w-full max-md:flex-col-reverse">
        <div
          className={clsx(
            "flex gap-fl-1 items-center text-text-2",
            "max-md:justify-center",
          )}
        >
          <a
            href={getResetHref(href.value)}
          >
            Play again
          </a>

          <form method="dialog" className="inline">
            <button
              type="submit"
              className="link p-0 bg-transparent"
              formNoValidate
              disabled={!hasSolution}
            >
              Close
            </button>
          </form>
        </div>

        <button
          form="solution"
          className="btn md:ml-auto max-md:w-full"
          type="submit"
          disabled={!hasSolution}
        >
          Post solution
        </button>
      </div>
    </Dialog>
  );
}
