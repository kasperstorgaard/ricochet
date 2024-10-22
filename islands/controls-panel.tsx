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

  const count = useMemo(() => Math.min(state.moves.length, state.cursor ?? 0), [
    state.moves.length,
    state.cursor,
  ]);

  const onReset = useCallback(() => updateLocation(getResetHref(href.value)), [
    href.value,
  ]);

  useGameShortcuts({
    onUndo: () => self.history.back(),
    onRedo: () => self.history.forward(),
    onReset,
  });

  return (
    <aside className="col-span-3 place-content-start grid grid-cols-subgrid min-h-[min(25vh,20rem)] border-t-2 border-brand bg-surface-2 text-fl-1 py-fl-3">
      <div className="flex col-[2/3] items-center gap-fl-1 w-full">
        <a
          href={getUndoHref(href.value, state)}
          className={cn(
            "flex items-center rounded-1 px-2 border-[currentColor] border-1 aspect-square",
            !state.cursor && "opacity-40",
          )}
          data-router="replace"
        >
          <i className="ph-arrow-arc-left ph-light" />
        </a>

        <div className="flex place-content-center justify-center text-fl-2 leading-0 min-w-[2ch] text-center font-3">
          {count < 10 ? `0${count}` : count}
        </div>

        <a
          href={getRedoHref(href.value, state)}
          className={cn(
            "flex items-center rounded-1 px-2 border-[currentColor] border-1 disabled:opacity-20 aspect-square",
            state.cursor === state.moves.length && "opacity-40",
          )}
          data-router="replace"
        >
          <i className="ph-arrow-arc-right ph-light" />
        </a>

        <a
          href={getResetHref(href.value)}
          className={cn(
            "flex items-center rounded-1 px-2 border-[currentColor] border-1 disabled:opacity-20 aspect-square ml-auto",
            state.cursor === 0 && "opacity-40",
          )}
          data-router="push"
        >
          <i className="ph-arrow-counter-clockwise ph-light" />
        </a>
      </div>
    </aside>
  );
}
