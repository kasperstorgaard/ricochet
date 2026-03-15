import { clsx } from "clsx/lite";
import { AnchorHTMLAttributes } from "preact";

import { Check, Icon, Trophy } from "#/components/icons.tsx";
import { Thumbnail } from "#/components/thumbnail.tsx";
import type { Puzzle } from "#/game/types.ts";

export type PuzzleCardProps =
  & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children">
  & {
    puzzle: Puzzle;
    bestMoves?: number;
    tagline?: string;
  };

/**
 * Canonical clickable puzzle card,
 * showing an svg of the puzzle, and letting the consumer pass the
 *
 * States:
 *   - visited: SVG dimmed + text mutes via CSS :visited (only when unsolved)
 *   - solved (bestMoves > minMoves): ph-check icon + move count
 *   - optimal (bestMoves === minMoves): ph-trophy icon + move count
 *
 * Pass `children` for a rich tagline or `tagline` for a plain string.
 */
export function PuzzleCard({
  puzzle,
  bestMoves,
  tagline,
  className,
  ...rest
}: PuzzleCardProps) {
  const isOptimal = bestMoves !== undefined &&
    puzzle.minMoves !== undefined &&
    bestMoves === puzzle.minMoves;
  const isSolved = bestMoves !== undefined;

  return (
    <a
      href={`/puzzles/${puzzle.slug}`}
      class={clsx(
        "group flex flex-col gap-2 text-text-1 no-underline",
        !isSolved && "visited:svg-dim",
        className,
      )}
      {...rest}
    >
      <div
        class={clsx(
          "relative flex border-2 border-link rounded-1",
          "group-hover:filter-[lighten(1.3)] transition-colors",
          !isOptimal && "group-visited:link-border-dim",
          isOptimal && "border-ui-2",
        )}
      >
        <Thumbnail
          board={puzzle.board}
          className="basis-0 grow aspect-square h-full"
        />

        <div
          class={clsx(
            "absolute bottom-0 right-0 px-3 bg-surface-2",
            "text-current leading-relaxed text-1 uppercase tracking-wider",
            "[clip-path:polygon(10%_0,100%_0,100%_100%,0_100%)]",
          )}
        >
          {puzzle.difficulty}
        </div>

        {isSolved && (
          <div
            class={clsx(
              "absolute top-0 right-0 p-fl-1",
              isOptimal ? "text-ui-2" : "text-brand",
            )}
          >
            <span
              class={clsx(
                "flex items-center gap-0.5 px-1 py-px rounded-1 bg-surface-1 border border-current/60",
                "whitespace-nowrap leading-tight text-1",
              )}
            >
              <Icon
                icon={isOptimal ? Trophy : Check}
                aria-label={isOptimal ? "Perfect" : "Solved"}
              />
              {bestMoves}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        {tagline && (
          <span
            className={clsx(
              "text-1 text-text-2 tracking-wide leading-tight",
              "group-hover:text-current",
            )}
          >
            {tagline}
          </span>
        )}
        <span className="text-4 font-semibold leading-flat">
          <span className="tracking-wide font-normal">#{puzzle.number}</span>
          {" "}
          <span>{puzzle.name}</span>
        </span>
      </div>
    </a>
  );
}
