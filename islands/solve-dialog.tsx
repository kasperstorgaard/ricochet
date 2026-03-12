import type { Signal } from "@preact/signals";
import { clsx } from "clsx/lite";
import { useEffect, useMemo, useState } from "preact/hooks";

import { Dialog } from "./dialog.tsx";
import { isValidSolution, resolveMoves } from "#/game/board.ts";
import { encodeMoves } from "#/game/strings.ts";
import { Puzzle } from "#/game/types.ts";
import { decodeState, encodeState } from "#/game/url.ts";
import { useRouter } from "#/islands/router.tsx";
import { useSolveStream } from "#/client/solve-stream.ts";

type Props = {
  puzzle: Signal<Puzzle>;
  href: Signal<string>;
};

export function SolveDialog({ puzzle, href }: Props) {
  const [modalState, setModalState] = useState<"solving" | "done" | null>(null);
  const gameState = useMemo(() => decodeState(href.value), [href.value]);
  const { updateLocation } = useRouter();

  const open = useMemo(() => {
    const url = new URL(href.value);
    return url.searchParams.get("dialog") === "solve";
  }, [href.value]);

  const moves = useMemo(
    () => gameState.moves.slice(0, gameState.cursor ?? gameState.moves.length),
    [
      gameState.moves,
      gameState.cursor,
    ],
  );

  const [remainingMoves, setRemainingMoves] = useState(() =>
    gameState.moves.slice(gameState.cursor ?? 0).length
  );

  const totalMoves = useMemo(
    () => moves.length + (remainingMoves ?? 0),
    [gameState, remainingMoves],
  );

  const closeModal = () => {
    const url = new URL(href.value);
    // Clear all non-relevant state and update url
    url.search = encodeState({ ...gameState, hint: undefined });
    updateLocation(url.href);
  };

  const { start: startSolve, cancel: cancelSolve } = useSolveStream((event) => {
    if (event.type === "progress") {
      setModalState("solving");
      setRemainingMoves(event.depth);
    } else if (event.type === "solution") {
      const url = new URL(href.value);
      url.searchParams.set("moves", encodeMoves(event.moves));
      url.searchParams.set("cursor", (gameState.cursor ?? 0).toString());
      updateLocation(url.href);
      setModalState("done");
    } else if (event.type === "error") {
      // TODO: show error
    }
  });

  // React to ?dialog=solve appearing in the URL (set by the server-side hint route)
  useEffect(() => {
    if (!open) {
      cancelSolve();
      return;
    }

    const board = resolveMoves(puzzle.value.board, moves);
    const isSolved = isValidSolution(board);

    if (isSolved) {
      setModalState("done");
      return;
    }

    // Not cached: stream the solve client-side
    startSolve(board);
  }, [open, puzzle.value, moves]);

  return (
    <Dialog
      open={open}
      className="w-sm!"
    >
      {modalState === "solving" && (
        <div class="flex flex-col gap-fl-3">
          <p class="text-fl-1 font-semibold">Solving…</p>

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
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {modalState === "done" && (
        <div class="flex flex-col gap-fl-2 text-text-2">
          <h2 className="text-fl-1 leading-tight text-text-1">
            There is {totalMoves === 8 ? "an" : "a"} {totalMoves}-move solution
          </h2>
          <p class="text-text-2 text-fl-0">
            Use the control panel undo/redo to see it
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
                Got it
              </button>
            </form>
          </div>
        </div>
      )}
    </Dialog>
  );
}
