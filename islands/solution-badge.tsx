import type { Signal } from "@preact/signals";
import { useEffect, useRef, useState } from "preact/hooks";
import { clsx } from "clsx/lite";

import { useDebouncedCallback } from "#/lib/use-debounced-callback.ts";
import { validateBoard } from "#/util/board.ts";
import type { Board, Puzzle } from "#/util/types.ts";

type SolutionBadgeProps = {
  puzzle: Signal<Puzzle>;
  moves?: Signal<number | null>;
  className?: string;
};

// Displays the shortest solution length, updated on a 3s debounce with fade transition.
export function SolutionBadge(
  { puzzle, className }: SolutionBadgeProps,
) {
  const ref = useRef<HTMLSpanElement>(null);

  const [moves, setMoves] = useState<number | null>(
    puzzle.value.difficulty ?? null,
  );
  const [error, setError] = useState<string | null>(null);

  const fetchSolution = useDebouncedCallback(async (board: Board) => {
    try {
      const res = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(board),
      });

      if (!res.ok) {
        setError(await res.text());
        return;
      }

      const { moves } = await res.json();

      setMoves(moves);
    } catch (err) {
      setError((err as Error).message);
    }
  }, 3000);

  useEffect(() => {
    const { board, difficulty } = puzzle.value;

    if (difficulty) {
      setMoves(difficulty);
      setError(null);
      return;
    }

    // Reset state
    setMoves(null);
    setError(null);

    if (board.pieces.length === 0) return;

    try {
      validateBoard(board);
    } catch (err) {
      setMoves(null);
      setError((err as Error).message);
      return;
    }

    fetchSolution(board);
  }, [puzzle.value.board]);

  return (
    <span
      ref={ref}
      className={clsx(
        "flex items-center justify-center px-fl-1 min-h-[2em]",
        "bg-surface-3 rounded-blob-3 font-mono",
        error && "bg-red-700 text-white",
        className,
      )}
      title={error ? error : undefined}
    >
      {error
        ? <i className="ph-warning ph" />
        : (
          <span className="min-w-[2ch] text-center">
            {moves ?? "?"}
          </span>
        )}
    </span>
  );
}
