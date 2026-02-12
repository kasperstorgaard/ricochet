import type { Signal } from "@preact/signals";
import { useCallback, useMemo } from "preact/hooks";

import { Panel } from "#/components/panel.tsx";
import { updateLocation } from "#/lib/router.ts";
import { cn } from "#/lib/style.ts";
import { useGameShortcuts } from "#/lib/keyboard.ts";
import {
  decodeState,
  getHintHref,
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
    onHint: () => {
      globalThis.location.href = getHintHref(href.value);
    },
  });

  return (
    <Panel>
      <div
        className={cn(
          "grid max-lg:col-[2/3] grid-cols-subgrid place-content-center items-center w-full gap-fl-3",
          "lg:grid lg:row-[3/5] lg:grid-rows-subgrid lg:content-end lg:gap-fl-2",
        )}
      >
        <div
          className={cn(
            "flex place-items-center gap-fl-1 justify-center w-full",
            "lg:place-self-end",
          )}
        >
          <a
            href={getUndoHref(href.value, state)}
            className={cn(
              "icon-btn",
              !state.cursor && "opacity-40",
            )}
            data-size="lg"
            data-router="replace"
          >
            <i className="ph-arrow-arc-left ph" />
          </a>

          <div
            className={cn(
              "flex items-center justify-center min-w-[2ch]",
              "text-center font-3 text-fl-3 leading-flat",
              "md:text-fl-2",
            )}
          >
            {count < 10 ? `0${count}` : count}
          </div>

          <a
            href={getRedoHref(href.value, state)}
            className={cn(
              "icon-btn",
              (state.cursor == null ||
                state.cursor === state.moves.length) && "opacity-40",
            )}
            data-size="lg"
            data-router="replace"
          >
            <i className="ph-arrow-arc-right text-current ph" />
          </a>
        </div>

        <div
          className={cn(
            "flex gap-x-fl-2 gap-y-fl-1 justify-center flex-wrap text-1",
            "lg:text-fl-0 lg:place-self-start lg:justify-self-center",
          )}
        >
          {
            /*
            Navigates to the /hint route,
            which provides a hint as a redirect back in the query params.
            This is slightly expensive, so needs to be on demand, not optimistic.
          */
          }
          <a
            href={getHintHref(href.value)}
            className="underline text-link bg-transparent hover:no-underline"
          >
            Get a hint
          </a>

          <a
            href={getResetHref(href.value)}
            className="underline text-link bg-transparent hover:no-underline"
            data-router="push"
          >
            Start over
          </a>
        </div>
      </div>
    </Panel>
  );
}
