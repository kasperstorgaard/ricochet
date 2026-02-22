import type { Signal } from "@preact/signals";
import { useCallback, useMemo, useState } from "preact/hooks";
import { clsx } from "clsx/lite";

import { NumberRange } from "#/components/number-range.tsx";
import { Panel } from "#/components/panel.tsx";
import { Select } from "#/components/select.tsx";
import { useRouter } from "#/lib/router.ts";
import { flipBoard, resolveMoves, rotateBoard } from "#/util/board.ts";
import { formatPuzzle } from "#/util/formatter.ts";
import type { GenerateOptions } from "#/util/generator.ts";
import { Puzzle } from "#/util/types.ts";
import { decodeState, encodeState } from "#/util/url.ts";

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

  const [message, setMessage] = useState("");
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
      board,
    }), [puzzle.value, board]);

  const onSave = useCallback(async () => {
    await fetch("/api/puzzles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: puzzle.value.slug, markdown: formatted }),
    });

    setMessage("puzzle saved!");

    const url = new URL(href.value);

    if (!url.pathname.startsWith(`/puzzles/${puzzle.value.slug}`)) {
      url.pathname = `/puzzles/${puzzle.value.slug}/edit`;
      updateLocation(url.href);
    }
  }, [href.value, puzzle.value.slug, formatted]);

  const onGenerate = useCallback(async () => {
    setIsGenerating(true);
    setMessage("");

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
        difficulty: moves.length,
      };
    } catch {
      setMessage("generation failed, try again");
    } finally {
      setIsGenerating(false);
    }
  }, [options, puzzle]);

  const [showOptions, setShowOptions] = useState(false);

  return (
    <Panel className="relative overflow-hidden">
      <div className="flex flex-col col-[2/3] lg:row-[3/4] gap-fl-1 place-content-between">
        <div className="flex flex-col place-items-start gap-fl-1 flex-wrap">
          <button
            type="button"
            className="btn"
            onClick={() => {
              puzzle.value = {
                ...puzzle.value,
                board: rotateBoard(puzzle.value.board, "right"),
              };
            }}
          >
            <i className="ph-arrow-clockwise ph" /> Rotate 90°
          </button>

          <button
            type="button"
            className="btn"
            onClick={() => {
              puzzle.value = {
                ...puzzle.value,
                board: flipBoard(puzzle.value.board, "horizontal"),
              };
            }}
          >
            <i className="ph-flip-horizontal ph" />Mirror
          </button>

          <button
            type="button"
            className="btn"
            onClick={() => {
              puzzle.value = {
                ...puzzle.value,
                board: flipBoard(puzzle.value.board, "vertical"),
              };
            }}
          >
            <i className="ph-flip-vertical ph" />Mirror
          </button>
        </div>

        <div className="flex flex-col place-items-start flex-wrap gap-fl-1">
          {message && (
            <p className="text-fl-0 text-purple-1 leading-tight">
              {message}
            </p>
          )}

          <div className="flex">
            <button
              type="button"
              className="btn rounded-r-none! border-r-0! pr-2!"
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

          {isDev
            ? (
              <button
                type="button"
                className="btn"
                onClick={onSave}
              >
                <i className="ph-floppy-disk ph" />Save
              </button>
            )
            : (
              <button
                type="button"
                className="btn"
                onClick={() => {
                  navigator.clipboard.writeText(formatted);
                  setMessage("copied!");
                }}
              >
                <i className="ph-copy ph" />Copy text
              </button>
            )}
        </div>
      </div>

      <div
        className={clsx(
          "absolute inset-0 bg-surface-2 p-fl-2 flex flex-col gap-fl-4",
          "transition-transform duration-200 ease-out",
          showOptions ? "translate-x-0" : "translate-x-full",
        )}
      >
        <button
          type="button"
          className="btn self-start"
          onClick={() => setShowOptions(false)}
        >
          <i className="ph-caret-left ph" />Back
        </button>

        <div className="flex flex-col gap-fl-1">
          <NumberRange
            name="solve_range"
            label="Moves"
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
