import type { Signal } from "@preact/signals";
import { clsx } from "clsx/lite";
import { useEffect, useMemo, useState } from "preact/hooks";

import { Dialog } from "./dialog.tsx";
import { useSolveStream } from "../client/solve-stream.ts";
import { useRouter } from "#/islands/router.tsx";
import { ArrowCounterClockwise, Icon } from "#/components/icons.tsx";
import { resolveMoves } from "#/game/board.ts";
import { encodeMove } from "#/game/strings.ts";
import { Puzzle } from "#/game/types.ts";
import { decodeState, encodeState, getResetHref } from "#/game/url.ts";

type Props = {
  puzzle: Signal<Puzzle>;
  href: Signal<string>;
};

export function HintDialog({ puzzle, href }: Props) {
  const [modalState, setModalState] = useState<"solving" | "done" | null>(null);
  const gameState = useMemo(() => decodeState(href.value), [href.value]);
  const minMoves = puzzle.value.minMoves;
  const { updateLocation } = useRouter();

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

  const [remainingMoves, setRemainingMoves] = useState(() => {
    const url = new URL(href.value);
    const rawValue = url.searchParams.get("remaining_moves");
    const parsed = rawValue ? Number.parseInt(rawValue, 10) : null;
    return Number.isNaN(parsed) || parsed == null ? null : parsed;
  });

  const totalMoves = useMemo(
    () => moves.length + (remainingMoves ?? 0),
    [gameState, remainingMoves],
  );

  // If you are 1 off from a perfect solution, you are considered off track
  // TODO: consider how much is needed for "off-track" really
  const offTrack = useMemo(() => {
    return modalState === "done" &&
      totalMoves > minMoves + 1;
  }, [modalState, minMoves, remainingMoves]);

  const closeModal = () => {
    const url = new URL(href.value);
    // Clear all non-relevant state and update url
    url.search = encodeState(gameState);
    updateLocation(url.href);
  };

  const { start: startSolve, cancel: cancelSolve } = useSolveStream((event) => {
    if (event.type === "progress") {
      setModalState("solving");
      setRemainingMoves(event.depth);
    } else if (event.type === "solution") {
      const url = new URL(href.value);
      url.searchParams.set("hint", encodeMove(event.moves[0]));
      updateLocation(url.href);
      setModalState("done");
    } else if (event.type === "error") {
      // TODO: show error
    }
  });

  // React to ?dialog=hint appearing in the URL (set by the server-side hint route)
  useEffect(() => {
    if (!open) {
      cancelSolve();
      return;
    }

    if (remainingMoves) {
      setModalState("done");
      return;
    }

    setModalState("solving");
    startSolve(resolveMoves(puzzle.value.board, moves));
  }, [open, href.value, remainingMoves]);

  return (
    <Dialog
      open={open}
      className="max-w-sm!"
    >
      {modalState === "solving" && (
        <div class="flex flex-col gap-fl-3">
          <p class="text-fl-1 font-semibold">Solving…</p>
          {/* <p class="text-text-2 text-fl-0">Watching the computer think</p> */}

          <span
            class={clsx(
              "text-fl-4 font-3 tabular-nums leading-flat",
              "animate-blink",
            )}
          >
            Searching {remainingMoves} move solutions...
          </span>

          <form method="dialog" className="inline">
            <button
              type="submit"
              className="link p-0 bg-transparent"
              formNoValidate
              disabled={!open}
              onClick={closeModal}
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {modalState === "done" && offTrack && (
        <div class="flex flex-col gap-fl-3">
          <p class="text-fl-1 font-semibold">You've gone off track</p>
          <p class="text-text-2 text-fl-0">
            There's a solution from here - but you need {totalMoves}{" "}
            total moves, and this puzzle has {minMoves === 8 ? "an" : "a"}{" "}
            {minMoves}-move solution.
          </p>

          <div class="flex items-center gap-fl-2">
            <a href={getResetHref(href.value)} class="btn">
              <Icon icon={ArrowCounterClockwise} />
              Start over
            </a>

            <form method="dialog" className="inline">
              <button
                type="submit"
                className="link p-0 bg-transparent"
                formNoValidate
                disabled={!open}
                onClick={closeModal}
              >
                Keep going
              </button>
            </form>
          </div>
        </div>
      )}

      {modalState === "done" && !offTrack && (
        <div class="flex flex-col gap-fl-2 text-text-2">
          <h2 className="text-fl-1 leading-tight text-text-1">
            There is a solution in {remainingMoves} more moves
          </h2>
          <p class="text-text-2 text-fl-0">
            The first move is highlighted on the board
          </p>

          <div class="flex items-center gap-fl-2">
            <form method="dialog" className="inline">
              <button
                type="submit"
                className="btn"
                formNoValidate
                disabled={!open}
                onClick={closeModal}
              >
                Nice, show me
              </button>
            </form>
          </div>
        </div>
      )}
    </Dialog>
  );
}
