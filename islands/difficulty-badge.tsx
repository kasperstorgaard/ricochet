import type { Signal } from "@preact/signals";
import { clsx } from "clsx/lite";
import { useEffect, useRef, useState } from "preact/hooks";

import { readSolveStream } from "#/lib/solve-stream.ts";
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
  const [solving, setSolving] = useState<
    { depth: number; states: number } | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSolution = useDebouncedCallback(async (board: Board) => {
    setSolving({ depth: 0, states: 0 });

    try {
      for await (const event of readSolveStream(board)) {
        if (event.type === "progress") {
          setSolving({ depth: event.depth, states: event.states });
        } else if (event.type === "solution") {
          setMinMoves(event.moves.length);
          setSolving(null);
        } else if (event.type === "error") {
          setError(event.message);
          setSolving(null);
        }
      }
    } catch (err) {
      setError((err as Error).message);
      setSolving(null);
    }
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
        error && "bg-red-700 text-white",
        className,
      )}
      title={error ? error : undefined}
    >
      {error ? <Icon icon={Warning} /> : (
        <>
          <span
            className="text-center text-fl-0 px-fl-1 uppercase cursor-help"
            title="puzzle difficulty"
          >
            {puzzle.value.difficulty ?? "unknown"}
          </span>

          {solving && (
            <span
              className="px-fl-1 pl-fl-1 bg-surface-3 text-fl-0 min-w-[2ch] -ml-1 opacity-50 tabular-nums"
              title={`searching depth ${solving.depth}, ${solving.states} states`}
            >
              {solving.depth}…
            </span>
          )}

          {!solving && minMoves != null && minMoves > 0 && (
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
