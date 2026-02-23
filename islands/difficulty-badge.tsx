import type { Signal } from "@preact/signals";
import { useEffect, useRef, useState } from "preact/hooks";
import { clsx } from "clsx/lite";

import { useDebouncedCallback } from "#/lib/use-debounced-callback.ts";
import { validateBoard } from "#/util/board.ts";
import type { Board, Puzzle } from "#/util/types.ts";

type DifficultyBadgeProps = {
  puzzle: Signal<Puzzle>;
  showMinMoves?: boolean;
  className?: string;
};

// Displays the shortest solution length, updated on a 3s debounce with fade transition.
export function DifficultyBadge(
  {
    puzzle,
    showMinMoves = false,
    className,
  }: DifficultyBadgeProps,
) {
  const ref = useRef<HTMLSpanElement>(null);

  const [minMoves, setMinMoves] = useState<number | null>(
    showMinMoves ? puzzle.value.minMoves ?? null : null,
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

      setMinMoves(moves);
    } catch (err) {
      setError((err as Error).message);
    }
  }, 3000);

  useEffect(() => {
    const { board, minMoves } = puzzle.value;

    if (!showMinMoves) {
      setMinMoves(null);
      setError(null);
      return;
    }

    if (minMoves) {
      setMinMoves(minMoves);
      setError(null);
      return;
    }

    // Reset state
    setMinMoves(null);
    setError(null);

    if (board.pieces.length === 0) return;

    try {
      validateBoard(board);
    } catch (err) {
      setMinMoves(null);
      setError((err as Error).message);
      return;
    }

    fetchSolution(board);
  }, [puzzle.value.board, showMinMoves]);

  return (
    <span
      ref={ref}
      className={clsx(
        "flex items-center justify-center",
        "bg-surface-2 font-mono cursor-help",
        error && "bg-red-700 text-white",
        className,
      )}
      title={error ? error : undefined}
    >
      {error ? <i className="ph-warning ph" /> : (
        <>
          <span
            className="text-center text-fl-0 px-fl-1 uppercase cursor-help"
            title="puzzle difficulty"
          >
            {puzzle.value.difficulty ?? "unknown"}
          </span>

          {showMinMoves && minMoves && (
            <span
              className={clsx(
                "px-fl-1 pl-fl-1 bg-surface-3 text-fl-0 min-w-[2ch] -ml-1",
                "cursor-help",
                "[clip-path:polygon(20%_0,100%_0,100%_100%,0_100%)]",
              )}
              title="shortest possible solution"
            >
              {minMoves}
            </span>
          )}
        </>
      )}
    </span>
  );
}
