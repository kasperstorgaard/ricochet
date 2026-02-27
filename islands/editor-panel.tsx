import type { Signal } from "@preact/signals";
import { clsx } from "clsx/lite";
import { useCallback, useMemo, useState } from "preact/hooks";

import { useRouter } from "#/client/router.ts";
import { NumberRange } from "#/components/number-range.tsx";
import { Panel } from "#/components/panel.tsx";
import { Select } from "#/components/select.tsx";
import { flipBoard, resolveMoves, rotateBoard } from "#/game/board.ts";
import { formatPuzzle } from "#/game/formatter.ts";
import type { GenerateOptions } from "#/game/generator.ts";
import { Puzzle } from "#/game/types.ts";
import { decodeState, encodeState } from "#/game/url.ts";

type EditorPanelProps = {
  href: Signal<string>;
  puzzle: Signal<Puzzle>;
  isDev: boolean;
};

const SPREAD_OPTIONS = [
  { value: "mid", label: "Mid" },
  { value: "balanced", label: "Balanced" },
  { value: "spread", label: "Spread" },
];

/**
 * Side panel for the puzzle editor.
 * Provides board transform actions (rotate, flip), puzzle generation,
 * and a save button (dev only) that writes directly to static puzzles.
 */
export function EditorPanel(
  { puzzle, href, isDev }: EditorPanelProps,
) {
  const onLocationUpdated = useCallback((url: URL) => {
    href.value = url.href;
  }, []);

  const { updateLocation } = useRouter({
    onLocationUpdated,
  });

  const board = useMemo(() => {
    const url = new URL(href.value);
    url.search = encodeState({
      ...puzzle.value.board,
      moves: [],
    });

    const state = decodeState(url.href);
    const moves = state.moves.slice(0, state.cursor ?? state.moves.length);

    return resolveMoves(puzzle.value.board, moves);
  }, [href.value, puzzle.value.board]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [options, setOptions] = useState<GenerateOptions>({
    solveRange: [6, 11],
    wallsRange: [5, 15],
    bouncersRange: [3, 5],
    wallSpread: "balanced",
  });

  const formatted = useMemo(() =>
    formatPuzzle({
      name: puzzle.value.name,
      slug: puzzle.value.slug,
      createdAt: puzzle.value.createdAt ?? new Date(Date.now()),
      difficulty: puzzle.value.difficulty,
      board,
    }), [puzzle.value, board]);

  const onSave = useCallback(async () => {
    await fetch("/api/puzzles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: puzzle.value.slug, markdown: formatted }),
    });

    const url = new URL(href.value);

    if (!url.pathname.startsWith(`/puzzles/${puzzle.value.slug}`)) {
      url.pathname = `/puzzles/${puzzle.value.slug}/edit`;
      updateLocation(url.href);
    }
  }, [href.value, puzzle.value.slug, formatted]);

  const onGenerate = useCallback(async () => {
    setIsGenerating(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
      });

      if (!res.ok) throw new Error("Generation failed");

      const { board: newBoard, moves } = await res.json();

      puzzle.value = {
        ...puzzle.value,
        board: newBoard,
        minMoves: moves.length,
      };
    } finally {
      setIsGenerating(false);
    }
  }, [options, puzzle]);

  const [showOptions, setShowOptions] = useState(false);

  return (
    <Panel className="relative overflow-hidden">
      <a
        href="/contribute"
        target="_blank"
        className={clsx(
          "col-[2/3] text-fl-1 mb-fl-4 text-link underline leading-tight",
          "lg:row-[1/3] lg:text-fl-0 lg:mb-0",
        )}
      >
        Guide: How to add puzzles
      </a>

      <div className="flex flex-col col-[2/3] lg:row-[3/4] gap-fl-4 lg:gap-fl-1 place-content-between">
        <div className="flex flex-col gap-fl-1 flex-wrap">
          <div className="flex gap-fl-1 flex-wrap lg:justify-center">
            <button
              type="button"
              className="icon-btn"
              data-size="sm"
              onClick={() => {
                puzzle.value = {
                  ...puzzle.value,
                  board: rotateBoard(puzzle.value.board, "right"),
                };
              }}
            >
              <i className="ph-arrow-clockwise ph" />
              <span className="sr-only">Rotate 90°</span>
            </button>

            <button
              type="button"
              className="icon-btn"
              data-size="sm"
              onClick={() => {
                puzzle.value = {
                  ...puzzle.value,
                  board: flipBoard(puzzle.value.board, "horizontal"),
                };
              }}
            >
              <i className="ph-flip-horizontal ph" />
              <span className="sr-only">Mirror Horizontally</span>
            </button>

            <button
              type="button"
              className="icon-btn"
              data-size="sm"
              onClick={() => {
                puzzle.value = {
                  ...puzzle.value,
                  board: flipBoard(puzzle.value.board, "vertical"),
                };
              }}
            >
              <i className="ph-flip-vertical ph" />
              <span className="sr-only">Mirror Vertically</span>
            </button>
          </div>

          <div className="flex w-full">
            <button
              type="button"
              className="btn rounded-r-none! border-r-0! grow!"
              disabled={isGenerating}
              onClick={onGenerate}
            >
              <i
                className={clsx(
                  "ph",
                  isGenerating ? "ph-circle-notch animate-spin" : "ph-shuffle",
                )}
              />
              Generate
            </button>

            <button
              type="button"
              className="icon-btn rounded-l-none! -ml-px!"
              data-size="sm"
              onClick={() => setShowOptions(!showOptions)}
            >
              <i className="ph-gear ph" />
            </button>
          </div>
        </div>

        <div className="flex flex-col flex-wrap gap-fl-1">
          {isDev && (
            <button
              type="button"
              className="btn"
              onClick={onSave}
            >
              <i className="ph-floppy-disk ph" />Save
            </button>
          )}

          <a
            href="/api/export"
            download
            className="btn"
          >
            <i className="ph-download-simple ph" />Download
          </a>

          <form
            action="/api/import"
            method="post"
            enctype="multipart/form-data"
            className="flex flex-row gap-1"
          >
            <label className="btn cursor-pointer flex-1">
              <i className="ph-arrow-square-in ph" />Import
              <input
                type="file"
                name="file"
                accept=".md"
                className="sr-only"
                onChange={(e) => e.currentTarget.form?.submit()}
              />
            </label>
            <noscript>
              <button className="icon-btn" type="submit" data-size="sm">
                <i className="ph-arrow-right ph" />
              </button>
            </noscript>
          </form>

          <a
            href="/puzzles/preview"
            className="btn"
            target="_blank"
          >
            <i className="ph-eye ph" /> Preview
          </a>
        </div>
      </div>

      <div
        className={clsx(
          "absolute inset-0 bg-surface-2 flex flex-col py-fl-3 px-fl-2",
          "transition-transform duration-200 ease-out",
          showOptions ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-start">
          <button
            type="button"
            className="btn"
            onClick={() => setShowOptions(false)}
          >
            <i className="ph-caret-left ph" />Back
          </button>
        </div>

        <div className="flex flex-col gap-fl-2 mt-fl-2">
          <NumberRange
            name="solve_range"
            label="Shortest solution"
            value={options.solveRange}
            min={1}
            max={20}
            onChange={(solveRange) => setOptions({ ...options, solveRange })}
          />

          <NumberRange
            name="walls_range"
            label="Walls"
            value={options.wallsRange}
            min={0}
            max={40}
            onChange={(wallsRange) => setOptions({ ...options, wallsRange })}
          />

          <NumberRange
            name="bouncers_range"
            label="Bouncers"
            value={options.bouncersRange}
            min={0}
            max={20}
            onChange={(bouncersRange) =>
              setOptions({ ...options, bouncersRange })}
          />

          <Select
            name="wall_spread"
            label="Wall spread"
            value={options.wallSpread}
            options={SPREAD_OPTIONS}
            onChange={(wallSpread) =>
              setOptions({
                ...options,
                wallSpread: wallSpread as GenerateOptions["wallSpread"],
              })}
          />
        </div>
      </div>
    </Panel>
  );
}
