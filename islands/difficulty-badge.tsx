import type { Signal } from "@preact/signals";
import { clsx } from "clsx/lite";
import { useEffect, useRef, useState } from "preact/hooks";

import { useDebouncedCallback } from "#/client/use-debounced-callback.ts";
import { Icon, Warning } from "#/components/icons.tsx";
import { validateBoard } from "#/game/board.ts";
import type { Board, Puzzle } from "#/game/types.ts";

type DifficultyBadgeProps = {
  puzzle: Signal<Puzzle>;
  className?: string;
};

// Displays the shortest solution length, updated on a 3s debounce with fade transition.
export function DifficultyBadge({ puzzle, className }: DifficultyBadgeProps) {
  const ref = useRef<HTMLSpanElement>(null);

  const [minMoves, setMinMoves] = useState<number | null>(
    puzzle.value.minMoves,
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

      setMinMoves(moves.length);
    } catch (err) {
      setError((err as Error).message);
    }
  }, 3000);

  useEffect(() => {
    const { board, minMoves } = puzzle.value;

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
  }, [puzzle.value.board]);

  return (
    <span
      ref={ref}
      className={clsx(
        "flex items-center justify-center",
        "bg-surface-2 cursor-help",
        className,
      )}
      title={error ? error : undefined}
    >
      <span
        className="text-center text-fl-0 px-fl-1 uppercase cursor-help"
        title={error ?? "puzzle difficulty"}
      >
        {error ? "error" : puzzle.value.difficulty ?? "unknown"}
      </span>

      <span
        className={clsx(
          "px-fl-1 pl-fl-1 bg-surface-3 text-fl-0 min-w-[3ch] -ml-1",
          "cursor-help",
          "[clip-path:polygon(20%_0,100%_0,100%_100%,0_100%)]",
        )}
        title={error ?? "shortest possible solution"}
      >
        {error ? <Icon icon={Warning} className="-mt-1" /> : minMoves || "?"}
      </span>
    </span>
  );
}
