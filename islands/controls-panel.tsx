import type { Signal } from "@preact/signals";
import { useCallback, useMemo } from "preact/hooks";

import { Panel } from "#/components/panel.tsx";
import { updateLocation } from "#/lib/router.ts";
import { cn } from "#/lib/style.ts";
import { useGameShortcuts } from "#/util/game.ts";
import {
  decodeState,
  getRedoHref,
  getResetHref,
  getUndoHref,
} from "#/util/url.ts";

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
    <Panel>
      <div
        className={cn(
          "flex max-lg:col-[2/3] items-center gap-fl-1 w-full",
          "lg:grid lg:grid-rows-subgrid lg:row-[3/4]",
        )}
      >
        <div className="flex place-items-center gap-fl-1 lg:row-start-4 lg:place-self-end">
          <a
            href={getUndoHref(href.value, state)}
            className={cn(
              "flex items-center rounded-1 px-2 text-text-1 border-current border-1 aspect-square",
              "hover:no-underline",
              !state.cursor && "opacity-40",
            )}
            data-router="replace"
          >
            <i className="ph-arrow-arc-left ph-light" />
          </a>

          <div
            className={cn(
              "flex items-center justify-center min-w-[2ch]",
              "text-center font-3 text-fl-2 leading-flat",
            )}
          >
            {count < 10 ? `0${count}` : count}
          </div>

          <a
            href={getRedoHref(href.value, state)}
            className={cn(
              "flex items-center rounded-1 px-2",
              "text-text-1 border-current border-1 aspect-square",
              "hover:no-underline disabled:opacity-20 ",
              (state.cursor == null ||
                state.cursor === state.moves.length) && "opacity-40",
            )}
            data-router="replace"
          >
            <i className="ph-arrow-arc-right text-current ph-light" />
          </a>
        </div>

        <a
          href={getResetHref(href.value)}
          className={cn(
            "flex items-center rounded-1 px-2 text-text-1 border-current border-1 disabled:opacity-20 aspect-square ml-auto",
            "hover:no-underline",
            (state.cursor == null || state.cursor === 0) && "opacity-40",
            "lg:row-[1/3] lg:place-self-start",
          )}
          data-router="push"
        >
          <i className="ph-arrow-counter-clockwise ph-light" />
        </a>
      </div>
    </Panel>
  );
}
