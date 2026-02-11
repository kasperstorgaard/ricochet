import type { Signal } from "@preact/signals";
import "./solution-badge.css";
import { useEffect, useRef, useState } from "preact/hooks";

import { useDebouncedCallback } from "#/lib/use-debounced-callback.ts";
import { validateBoard } from "#/util/board.ts";
import type { Board, Puzzle } from "#/util/types.ts";
import { cn } from "../lib/style.ts";

type SolutionBadgeProps = {
  puzzle: Signal<Puzzle>;
};

/** Displays the shortest solution length, updated on a 3s debounce with fade transition. */
export function SolutionBadge({ puzzle }: SolutionBadgeProps) {
  const ref = useRef<HTMLSpanElement>(null);

  const [moves, setMoves] = useState<number | null>();
  const [error, setError] = useState<string | null>(null);

  // Trigger animation on data change
  useEffect(() => {
    const el = ref.current;
    if (!el || !moves) return;

    const cleanup = () => {
      el.removeAttribute("data-animate");
      el.removeEventListener("animationend", cleanup);
      el.removeEventListener("animationcancel", cleanup);
    };

    el.addEventListener("animationend", cleanup);
    el.addEventListener("animationcancel", cleanup);

    el.setAttribute("data-animate", "");

    return cleanup;
  }, [moves, error]);

  const fetchSolution = useDebouncedCallback(async (board: Board) => {
    try {
      const res = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(board),
      });

      if (!res.ok) {
        setMoves(null);
        setError(await res.text());
        return;
      }

      const { moves } = await res.json();

      setError(null);
      setMoves(moves);
    } catch (err) {
      setMoves(null);
      setError((err as Error).message);
    }
  }, 3000);

  useEffect(() => {
    const { board } = puzzle.value;

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
      className={cn(
        "flex items-center justify-center px-fl-1",
        "bg-surface-3 rounded-blob-3 font-mono",
        "data-animate:animate-fade-in",
        error && "bg-red-700 text-white",
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
