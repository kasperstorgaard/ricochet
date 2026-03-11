import { type Signal } from "@preact/signals";
import clsx from "clsx/lite";
import { useMemo, useState } from "preact/hooks";

import { Icon, Info, Spinner } from "#/components/icons.tsx";
import { isValidSolution, resolveMoves } from "#/game/board.ts";
import { getSolutionPercentile } from "#/game/stats.ts";
import { Move, Onboarding, Puzzle, PuzzleStats } from "#/game/types.ts";
import { decodeState, getResetHref } from "#/game/url.ts";
import { Dialog } from "#/islands/dialog.tsx";

type Props = {
  href: Signal<string>;
  puzzle: Signal<Puzzle>;
  isPreview?: boolean;
  onboarding?: Onboarding;
  stats: PuzzleStats;
  savedName?: string | null;
};

export function SolutionDialog(
  { href, puzzle, isPreview, onboarding, stats, savedName }: Props,
) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const state = useMemo(() => decodeState(href.value), [href.value]);
  const error = useMemo(
    () => new URL(href.value).searchParams.get("error"),
    [href.value],
  );

  const moves = useMemo(
    () => state.moves.slice(0, state.cursor ?? state.moves.length),
    [state.moves, state.cursor],
  );

  const board = useMemo(() => resolveMoves(puzzle.value.board, moves), [
    puzzle.value.board,
    moves,
  ]);

  const hasSolution = useMemo(() => isValidSolution(board), [board]);

  const minMoves = puzzle.value.minMoves;
  const isGraduating = useMemo(
    () =>
      onboarding !== "done" &&
      moves.length <= minMoves * 1.33,
    [onboarding, minMoves, moves.length],
  );

  return (
    <Dialog open={hasSolution} className="max-w-md!">
      <div className="flex flex-col gap-fl-2 text-text-2">
        <h2 className="text-fl-2 leading-flat text-text-1">
          Solved in <span className="text-ui-2">{moves.length}</span> moves
        </h2>

        {isGraduating &&
          (
            <p>
              You've found your feet — the full puzzle archive is yours now.
            </p>
          )}

        {!isGraduating && stats && !error && (
          <StatsMessage
            stats={stats}
            moves={moves}
            minMoves={minMoves}
          />
        )}
      </div>

      {!isPreview && error === "duplicate" && (
        <div className="flex gap-fl-1 items-center">
          <Icon icon={Info} class="text-fl-1" />
          <p className="text-text-2 leading-tight">
            You've already posted this solution -
            <br />
            <a href={`/puzzles/${puzzle.value.slug}/solutions`}>
              view all solutions
            </a>.
          </p>
        </div>
      )}

      {!isPreview && !error && (
        <form
          id="solution"
          className="flex flex-col gap-fl-2"
          action={puzzle.value.slug}
          method="post"
          onSubmit={() => setIsSubmitting(true)}
        >
          <label className="flex flex-col gap-1">
            <span className="text-text-2 text-1">Name</span>

            <input
              name="name"
              autocomplete="name"
              placeholder="fx. Jungleboi87"
              value={savedName ?? undefined}
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
            Try again
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

        {!isPreview && !error && (
          <button
            form="solution"
            className="btn md:ml-auto max-md:w-full"
            type="submit"
            disabled={!hasSolution || isSubmitting}
          >
            {isSubmitting
              ? <Icon icon={Spinner} class="animate-spin" />
              : "Post solution"}
          </button>
        )}
      </div>
    </Dialog>
  );
}

function StatsMessage(
  { stats, moves, minMoves }: {
    stats: PuzzleStats;
    moves: Move[];
    minMoves: number;
  },
) {
  const { solutionsHistogram, totalSolutions } = stats;
  const isOptimal = moves.length === minMoves;

  // Stat 1: first to find the optimal solution
  if (isOptimal && !solutionsHistogram[moves.length]) {
    return <p>You found the first perfect solution, well done!</p>;
  }

  // Stat 2: top 40% by move count — only meaningful with enough data
  const percentile = totalSolutions >= 10
    ? getSolutionPercentile(stats, moves.length)
    : 0;
  if (percentile >= 60) {
    const rounded = Math.round(percentile / 5) * 5;
    return <p>Sharp! You used fewer moves than {rounded}% of players.</p>;
  }

  // Fallback: neutral total count
  if (totalSolutions > 0) {
    const others = totalSolutions === 1
      ? "1 other user"
      : `${totalSolutions} other users`;
    return <p>Good solve - join {others}, post yours.</p>;
  }

  return <p>Be the first to post a solution.</p>;
}
