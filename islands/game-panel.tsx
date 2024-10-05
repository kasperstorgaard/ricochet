import type { Signal } from "@preact/signals";
import { useCallback, useMemo } from "preact/hooks";
import { decodeState } from "#/util/url.ts";
import { cn } from "#/lib/style.ts";
import { getRedoHref, getResetHref, getUndoHref } from "#/util/game.ts";
import { useGameShortcuts } from "#/util/game.ts";
import { updateLocation } from "#/lib/router.ts";

type GamePanelProps = {
  href: Signal<string>;
};

export default function GamePanel({ href }: GamePanelProps) {
  const state = useMemo(() => decodeState(href.value), [href.value]);

  const onReset = useCallback(() => updateLocation(getResetHref(href.value)), [
    href.value,
  ]);

  useGameShortcuts({
    onUndo: () => window.history.back(),
    onRedo: () => window.history.forward(),
    onReset,
  });

  return (
    <div className="flex col-[2/3] place-items-start gap-fl-1 text-fl-1 w-full">
      <a
        className={cn(
          "rounded-2 px-fl-1 border-gray-3 border-1",
          state.cursor === 0 && "opacity-40",
        )}
        href={getUndoHref(href.value, state)}
      >
        <i className="ph-arrow-arc-left ph-bold" />
      </a>

      <div className="flex place-content-center text-fl-1 w-4">
        {Math.min(state.moves.length, state.cursor ?? 0)}
      </div>

      <a
        href={getRedoHref(href.value, state)}
        className={cn(
          "rounded-2 px-fl-1 border-gray-3 border-1 disabled:opacity-20",
          self.history?.length === 0 && "opacity-40",
        )}
      >
        <i className="ph-arrow-arc-right ph-bold" />
      </a>

      <a
        href={getResetHref(href.value)}
        className={cn(
          "rounded-2 px-fl-1 border-gray-3 border-1 disabled:opacity-20 ml-auto",
          !state.moves.length && "opacity-40",
        )}
      >
        <i className="ph-arrow-counter-clockwise ph-bold" />
      </a>
    </div>
  );
}
