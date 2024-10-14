import type { Signal } from "@preact/signals";
import { useCallback, useMemo } from "preact/hooks";
import { decodeState } from "#/util/url.ts";
import { cn } from "#/lib/style.ts";
import { getRedoHref, getResetHref, getUndoHref } from "#/util/game.ts";
import { useGameShortcuts } from "#/util/game.ts";
import { updateLocation } from "#/lib/router.ts";

type ControlsPanelProps = {
  href: Signal<string>;
};

export function ControlsPanel({ href }: ControlsPanelProps) {
  const state = useMemo(() => decodeState(href.value), [href.value]);

  const onReset = useCallback(() => updateLocation(getResetHref(href.value)), [
    href.value,
  ]);

  useGameShortcuts({
    onUndo: () => self.history.back(),
    onRedo: () => self.history.forward(),
    onReset,
  });

  return (
    <div className="flex col-[2/3] place-items-start gap-fl-1 px-3 text-fl-1 w-full">
      <a
        href={getUndoHref(href.value, state)}
        className={cn(
          "rounded-2 px-2 border-gray-3 border-1",
          !state.cursor && "opacity-40",
        )}
        data-router="replace"
      >
        <i className="ph-arrow-arc-left ph-bold" />
      </a>

      <div className="flex place-content-center text-fl-1 w-4">
        {Math.min(state.moves.length, state.cursor ?? 0)}
      </div>

      <a
        href={getRedoHref(href.value, state)}
        className={cn(
          "rounded-2 px-2 border-gray-3 border-1 disabled:opacity-20",
          state.cursor === state.moves.length && "opacity-40",
        )}
        data-router="replace"
      >
        <i className="ph-arrow-arc-right ph-bold" />
      </a>

      <a
        href={getResetHref(href.value)}
        className={cn(
          "rounded-2 px-2 border-gray-3 border-1 disabled:opacity-20 ml-auto",
          state.cursor === 0 && "opacity-40",
        )}
      >
        <i className="ph-arrow-counter-clockwise ph-bold" />
      </a>
    </div>
  );
}
