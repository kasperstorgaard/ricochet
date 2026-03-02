import type { Signal } from "@preact/signals";
import { clsx } from "clsx/lite";
import { useCallback, useEffect, useMemo, useState } from "preact/hooks";

import { useGameShortcuts } from "#/client/keyboard.ts";
import { updateLocation } from "#/client/router.ts";
import { Panel } from "#/components/panel.tsx";
import { Puzzle } from "#/game/types.ts";
import {
  decodeState,
  getHintHref,
  getRedoHref,
  getResetHref,
  getUndoHref,
} from "#/game/url.ts";

type ControlsPanelProps = {
  puzzle: Signal<Puzzle>;
  href: Signal<string>;
  isDev: boolean;
  hintCount: number;
  isPreview?: boolean;
  className?: string;
};

export function ControlsPanel(
  { puzzle, href, isDev, hintCount, isPreview, className }: ControlsPanelProps,
) {
  const [copied, setCopied] = useState(false);

  const onShare = useCallback(async () => {
    const url = new URL(href.value);
    url.search = "";
    const shareUrl = url.href;

    if ("share" in navigator) {
      await globalThis.navigator.share({
        title: puzzle.value.name,
        url: shareUrl,
      });
    } else {
      await globalThis.navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [href.value, puzzle.value.name]);

  const hintLimit = puzzle.value.difficulty === "easy" ? 3 : 1;
  const hintsExhausted = !isDev && !isPreview && hintCount >= hintLimit;

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
      if (hintsExhausted) return;
      globalThis.location.href = getHintHref(href.value);
    },
  });

  // Clear game state before print
  useEffect(() => {
    if (!("onbeforeprint" in globalThis)) return;

    globalThis.addEventListener("beforeprint", onReset);
    return () => globalThis.removeEventListener("beforeprint", onReset);
  }, []);

  // Print on load if search params has ?print
  useEffect(() => {
    const url = new URL(href.value);

    if (!url.searchParams.has("print")) return;
    if (!("print" in globalThis)) return;

    // print the page
    globalThis.print();

    // Clear the search params to avoid weird loops
    url.searchParams.delete("print");
    updateLocation(url.href);
  }, [href.value]);

  return (
    <Panel className={className}>
      <div
        className={clsx(
          "grid max-lg:col-[2/3] grid-cols-subgrid place-content-center items-center w-full max-lg:gap-fl-4",
          "lg:grid lg:row-[3/4] lg:items-start lg:grid-rows-[1fr_auto] lg:gap-fl-3",
        )}
      >
        <div className="flex flex-col gap-fl-1 justify-start">
          <div
            className={clsx(
              "flex place-items-center justify-center gap-fl-1 w-full",
              "lg:place-self-center",
            )}
          >
            <a
              href={getUndoHref(href.value, state)}
              className="icon-btn"
              aria-disabled={!state.cursor ? true : undefined}
              data-primary
              data-size="lg"
              data-router="replace"
            >
              <i className="ph-arrow-arc-left ph" />
            </a>

            <div
              className={clsx(
                "flex items-center justify-center min-w-[2ch]",
                "text-center font-3 leading-flat",
                "max-lg:text-7",
                "lg:text-fl-2",
              )}
            >
              {count < 10 ? `0${count}` : count}
            </div>

            <a
              href={getRedoHref(href.value, state)}
              className="icon-btn"
              aria-disabled={state.cursor == null ||
                  state.cursor === state.moves.length
                ? true
                : undefined}
              data-primary
              data-size="lg"
              data-router="replace"
            >
              <i className="ph-arrow-arc-right text-current ph" />
            </a>
          </div>

          <div
            className={clsx(
              "flex gap-fl-1 justify-center flex-wrap text-1",
              "lg:text-fl-0 lg:justify-self-center",
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
              href={hintsExhausted ? "#" : getHintHref(href.value)}
              aria-disabled={hintsExhausted ? true : undefined}
            >
              {!hintsExhausted
                ? "Get a hint"
                : puzzle.value.difficulty === "easy"
                ? "Hints used"
                : "Hint used"}
            </a>

            <a
              href={getResetHref(href.value)}
              className="bg-transparent"
              data-router="push"
            >
              Start over
            </a>
          </div>
        </div>

        <div className="flex justify-center gap-fl-1 flex-wrap lg:grid lg:grid-cols-1">
          <button
            type="button"
            className="btn"
            onClick={onShare}
          >
            <i
              className={clsx(copied ? "ph-check ph" : "ph-share-network ph")}
            />
            {copied ? "Copied!" : "Share"}
          </button>

          <button
            type="button"
            className="btn"
            onClick={() => globalThis.print()}
          >
            <i className="ph-printer ph" /> Print
          </button>

          {puzzle.value.slug !== "preview" && (
            <a
              href={`/puzzles/${puzzle.value.slug}/clone`}
              className="btn"
            >
              <i className="ph-shuffle ph" /> Remix
            </a>
          )}

          {isPreview && (
            <a href="/api/export" download className="btn">
              <i className="ph-download ph" />
              Download
            </a>
          )}

          {
            /*
              TODO: surface solutions post-solve once per-puzzle completion
              state is tracked — removed from here as it was a heavy CTA on
              mobile for a "give up / compare" action that should be contextual.
            */
          }
        </div>
      </div>
    </Panel>
  );
}
