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
        "group flex flex-col gap-1 text-text-1 no-underline",
        !isSolved && "visited:svg-dim",
        className,
      )}
      {...rest}
    >
      <div
        class={clsx(
          "relative flex border-1 border-link",
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
            "absolute bottom-0 right-0 px-fl-1 py-0.5 bg-surface-2",
            "text-current text-0 uppercase tracking-[0.05em] border-t-1 border-t-transparent",
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
            <span class="flex items-center gap-0.5 text-xs px-1 py-px rounded-1 bg-surface-1 border border-current/60 whitespace-nowrap leading-tight">
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
              "text-0 text-text-2 tracking-wide leading-flat mt-1.5 -mb-0.5",
              "group-hover:text-current",
            )}
          >
            {tagline}
          </span>
        )}
        <span className="text-2 flex items-center flex-wrap leading-tight font-4">
          #{puzzle.number} {puzzle.name}
        </span>
      </div>
    </a>
  );
}
