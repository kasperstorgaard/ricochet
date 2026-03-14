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
  solverEnabled?: boolean;
  className?: string;
};

// Displays the shortest solution length, updated on a 3s debounce with fade transition.
export function DifficultyBadge(
  { puzzle, solverEnabled, className }: DifficultyBadgeProps,
) {
  const ref = useRef<HTMLSpanElement>(null);

  const [minMoves, setMinMoves] = useState<number | null>(
    puzzle.value.minMoves,
  );
  const [solving, setSolving] = useState<{ depth: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { start: startSolve, cancel: cancelSolve } = useSolveStream((event) => {
    if (event.type === "progress") {
      console.log("progress");
      setSolving({ depth: event.depth });
    } else if (event.type === "solution") {
      setMinMoves(event.moves.length);
      console.log("solved");
      setSolving(null);
    } else if (event.type === "error") {
      setError(event.message);
      setSolving(null);
    }
  });

  const fetchSolution = useDebouncedCallback((board: Board) => {
    cancelSolve();
    setSolving({ depth: 0 });

    console.log("starting");
    startSolve(board);
  }, 3000);

  useEffect(() => {
    const { board, minMoves } = puzzle.value;

    if (!solverEnabled || minMoves) {
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
  }, [solverEnabled, puzzle.value.board, puzzle.value.minMoves]);

  return (
    <span
      ref={ref}
      className={clsx(
        "flex items-center pl-1 justify-center text-2",
        "bg-surface-2 cursor-help tracking-wider",
        "[clip-path:polygon(5%_0,100%_0,100%_100%,0_100%)]",
        className,
      )}
      title={error ? error : undefined}
    >
      <span
        className="text-center px-2 uppercase cursor-help"
        title={error ?? "puzzle difficulty"}
      >
        {error ? "error" : puzzle.value.difficulty ?? "unknown"}
      </span>

      {error && (
        <span className="px-1 bg-surface-3 text-text-2">
          <Icon icon={Warning} className="m-1" />
        </span>
      )}

      {!error && solving && (
        <span
          className="px-2 bg-surface-3 min-w-[3ch] text-text-2 tabular-nums animate-blink"
          title={`searching depth ${solving.depth}`}
        >
          {solving.depth ? solving.depth : "?"}
        </span>
      )}

      {!error && !solving && (
        <span
          className={clsx(
            "px-2 bg-surface-3 min-w-[3ch] text-center",
            "cursor-help",
          )}
          title="shortest possible solution"
        >
          {minMoves ?? "?"}
        </span>
      )}
    </span>
  );
}
