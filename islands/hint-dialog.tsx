import type { Signal } from "@preact/signals";
import { useCallback, useEffect, useMemo } from "preact/hooks";

import { Dialog } from "./dialog.tsx";
import { useDelayedValue } from "#/client/use-delayed-value.ts";
import { useSolveStream } from "#/client/use-solve-stream.ts";
import { ArrowCounterClockwise, Icon } from "#/components/icons.tsx";
import { resolveMoves } from "#/game/board.ts";
import { encodeMove } from "#/game/strings.ts";
import { Move, Puzzle } from "#/game/types.ts";
import { decodeState, encodeState, getResetHref } from "#/game/url.ts";
import { useRouter } from "#/islands/router.tsx";

type Props = {
  puzzle: Signal<Puzzle>;
  href: Signal<string>;
};

type SolveState = {
  status: "starting";
} | {
  status: "solving";
  depth: number;
} | {
  status: "done";
  moves: Move[];
} | {
  status: "error";
};

export function HintDialog({ puzzle, href }: Props) {
  const gameState = useMemo(() => decodeState(href.value), [href.value]);
  const minMoves = puzzle.value.minMoves;
  const {
    value: solveState,
    queueValue: queueSolveState,
    clearQueue: clearSolveValue,
  } = useDelayedValue<
    SolveState
  >({
    status: "solving",
    depth: 0,
  });

  const onLocationUpdated = useCallback((url: URL) => {
    href.value = url.href;
  }, []);

  const { updateLocation } = useRouter({ onLocationUpdated });

  const open = useMemo(() => {
    const url = new URL(href.value);
    return url.searchParams.get("dialog") === "hint";
  }, [href.value]);

  const moves = useMemo(
    () => gameState.moves.slice(0, gameState.cursor ?? gameState.moves.length),
    [
      gameState.moves,
      gameState.cursor,
    ],
  );

  const remainingMoves = useMemo(
    () => solveState?.status === "done" ? solveState.moves.length : 0,
    [solveState],
  );

  const resetHref = useMemo(() => {
    const url = new URL(href.value);
    url.searchParams.delete("dialog");
    return getResetHref(url.href);
  }, [href.value]);

  const totalMoves = useMemo(
    () => moves.length + remainingMoves,
    [gameState, remainingMoves],
  );

  // If you are 1 off from a perfect solution, you are considered off track
  // TODO: consider how much is needed for "off-track" really
  const offTrack = useMemo(() => {
    return solveState?.status === "done" &&
      totalMoves > minMoves + 2;
  }, [solveState, minMoves, remainingMoves]);

  const closeModal = () => {
    const url = new URL(href.value);
    // Clear all non-relevant state and update url
    url.search = encodeState(gameState);
    updateLocation(url.href);
  };

  const { start: startSolve, cancel: cancelSolve } = useSolveStream((event) => {
    if (event.type === "progress") {
      queueSolveState({
        status: "solving",
        depth: event.depth,
      }, {
        delay: event.depth <= 2 ? 1400 : 700,
      });
    } else if (event.type === "solution") {
      queueSolveState({ status: "done", moves: event.moves }, { delay: 1000 });
    } else if (event.type === "error") {
      queueSolveState({ status: "error" }, { immediate: true });
    }
  });

  // React to ?dialog=hint appearing in the URL (set by the server-side hint route)
  useEffect(() => {
    if (!open) {
      clearSolveValue();
      return;
    }

    queueSolveState({ status: "starting" }, { immediate: true });

    const board = resolveMoves(puzzle.value.board, moves);
    startSolve(board);

    return cancelSolve;
  }, [open]);

  useEffect(() => {
    if (solveState?.status !== "done") return;

    const url = new URL(href.value);
    url.searchParams.set("hint", encodeMove(solveState.moves[0]));
    updateLocation(url.href);
  }, [solveState]);

  return (
    <Dialog
      open={open}
      className="max-w-sm!"
    >
      <div class="flex flex-col gap-fl-2 text-text-2">
        {solveState?.status === "starting" && (
          <>
            <h2 class="text-fl-1 text-text-1 font-semibold leading-tight">
              Warming up the solver…
            </h2>

            <p class="leading-snug">
              Crunching your moves…
            </p>

            <div class="flex items-center gap-fl-2 mt-fl-1">
              <button
                type="button"
                className="link p-0 bg-transparent"
                disabled={!open}
                onClick={closeModal}
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {solveState?.status === "solving" && (
          <>
            <p class="text-fl-1 text-text-1 font-semibold leading-tight">
              Finding the shortest path…
            </p>

            <span class="leading-snug animate-blink">
              Trying all {solveState.depth}-move paths from here…
            </span>

            <div class="flex items-center gap-fl-2 mt-fl-1">
              <button
                type="button"
                className="link p-0 bg-transparent"
                disabled={!open}
                onClick={closeModal}
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {solveState?.status === "done" && offTrack && (
          <>
            <h2 class="text-fl-1 text-text-1 font-semibold leading-tight">
              You've gone a bit off track
            </h2>

            <p className="leading-snug">
              You can still solve the puzzle, but you'll need {totalMoves}{" "}
              moves total (optimal is {minMoves})
            </p>

            <p className="leading-snug">
              The next move is highlighted on the board
            </p>

            <div class="flex items-center gap-fl-2 mt-fl-1">
              <a href={resetHref} class="btn">
                <Icon icon={ArrowCounterClockwise} />
                Start over
              </a>

              <button
                type="button"
                className="link p-0 bg-transparent"
                disabled={!open}
                onClick={closeModal}
              >
                Keep going
              </button>
            </div>
          </>
        )}

        {solveState?.status === "done" && !offTrack && (
          <>
            <h2 className="text-fl-1 leading-tight text-text-1">
              Found it - {remainingMoves}{" "}
              {remainingMoves && remainingMoves === 1 ? "move" : "moves"} to go
            </h2>

            <p className="leading-snug">
              The first move is highlighted, the rest is on you
            </p>

            <div class="flex items-center gap-fl-2 mt-fl-1">
              <button
                type="button"
                className="btn"
                disabled={!open}
                onClick={closeModal}
              >
                Got it
              </button>
            </div>
          </>
        )}

        {solveState?.status === "error" && (
          <>
            <h2 class="text-fl-1 text-text-1 font-semibold leading-tight">
              Something went wrong
            </h2>

            <p>
              The solver couldn't find a solution. Try again later.
            </p>

            <div class="flex items-center gap-fl-2 mt-fl-1">
              <button
                type="button"
                className="btn"
                disabled={!open}
                onClick={closeModal}
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}
