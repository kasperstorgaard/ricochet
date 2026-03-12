import type { Signal } from "@preact/signals";
import { clsx } from "clsx/lite";
import { useEffect, useRef, useState } from "preact/hooks";

import { useDebouncedCallback } from "#/client/use-debounced-callback.ts";
import { useSolveStream } from "#/client/use-solve-stream.ts";
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
  const [solving, setSolving] = useState<{ depth: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { start: startSolve } = useSolveStream((event) => {
    if (event.type === "progress") {
      setSolving({ depth: event.depth });
    } else if (event.type === "solution") {
      setMinMoves(event.moves.length);
      setSolving(null);
    } else if (event.type === "error") {
      setError(event.message);
      setSolving(null);
    }
  });

  const fetchSolution = useDebouncedCallback((board: Board) => {
    setSolving({ depth: 0 });
    startSolve(board);
  }, 3000);

  useEffect(() => {
    const { board, minMoves } = puzzle.value;

    if (minMoves) {
      setMinMoves(minMoves);
      setError(null);
      setSolving(null);
      return;
    }

    setMinMoves(null);
    setError(null);
    setSolving(null);

    if (board.pieces.length === 0) return;

    try {
      validateBoard(board);
    } catch (err) {
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
        className="text-center text-fl-0 px-fl-1 uppercase"
        title={error ? undefined : "puzzle difficulty"}
      >
        {error ? "error" : puzzle.value.difficulty ?? "unknown"}
      </span>

      {error && (
        <span className="px-1 bg-surface-3 text-fl-0 -ml-1 text-text-2">
          <Icon icon={Warning} className="m-1" />
        </span>
      )}

      {!error && solving && (
        <span
          className="px-fl-1 pl-fl-1 bg-surface-3 text-fl-0 min-w-[3ch] -ml-1 text-text-2 tabular-nums animate-blink"
          title={`searching depth ${solving.depth}`}
        >
          {solving.depth ? solving.depth : "?"}
        </span>
      )}

      {!error && !solving && (
        <span
          className={clsx(
            "px-fl-1 pl-fl-1 bg-surface-3 text-fl-0 min-w-[3ch] -ml-1",
            "cursor-help",
            "[clip-path:polygon(20%_0,100%_0,100%_100%,0_100%)]",
          )}
          title="shortest possible solution"
        >
          {minMoves ?? "?"}
        </span>
      )}
    </span>
  );
}
