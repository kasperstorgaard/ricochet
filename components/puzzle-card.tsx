import { clsx } from "clsx/lite";
import { AnchorHTMLAttributes } from "preact";

import { Thumbnail } from "#/components/thumbnail.tsx";
import type { Puzzle } from "#/game/types.ts";

export type PuzzleCardProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  puzzle: Puzzle;
  completed?: boolean;
  tagline?: string;
};

/**
 * Canonical puzzle card — thumbnail + difficulty badge.
 *
 * States:
 *   - visited: SVG grayscales + text mutes via CSS :visited (zero JS)
 *   - completed: star icon alongside difficulty (optimal solution posted)
 *
 * Pass `children` for a rich tagline or `tagline` for a plain string.
 */
export function PuzzleCard({
  puzzle,
  completed,
  tagline,
  className,
  children,
  ...rest
}: PuzzleCardProps) {
  return (
    <a
      href={`puzzles/${puzzle.slug}`}
      class={clsx(
        "group flex flex-col gap-fl-1 text-text-2 no-underline",
        "visited:svg-dim vi",
        className,
      )}
      {...rest}
    >
      <div
        class={clsx(
          "relative flex border-1 border-link",
          "group-hover:filter-[lighten(1.3)] group-visited:border-text-2 transition-colors",
        )}
      >
        <Thumbnail
          board={puzzle.board}
          class="basis-0 grow aspect-square h-full"
        />

        <div
          class={clsx(
            "absolute bottom-0 right-0 px-fl-1 py-0.5 bg-surface-2",
            "text-current text-0 uppercase border-t-1 border-t-transparent",
            "[clip-path:polygon(10%_0,100%_0,100%_100%,0_100%)]",
          )}
        >
          {puzzle.difficulty}
        </div>

        {completed && (
          <div class="absolute top-0 right-0 p-fl-1">
            <i class="ph ph-star text-ui-2" aria-label="Solved" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-0.5">
        {tagline && (
          <span className="text-0 text-text-2 group-hover:text-current tracking-wide leading-flat">
            {tagline}
          </span>
        )}
        <span className="flex flex-wrap leading-tight font-4">
          {children}
        </span>
      </div>
    </a>
  );
}
