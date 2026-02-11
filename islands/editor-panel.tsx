import type { Signal } from "@preact/signals";
import { useCallback, useMemo, useState } from "preact/hooks";

import { Panel } from "#/components/panel.tsx";
import { useRouter } from "#/lib/router.ts";
import { flipBoard, resolveMoves, rotateBoard } from "#/util/board.ts";
import { formatPuzzle } from "#/util/formatter.ts";
import { Puzzle } from "#/util/types.ts";
import { decodeState, encodeState } from "#/util/url.ts";

type EditorPanelProps = {
  href: Signal<string>;
  puzzle: Signal<Puzzle>;
  isDev: boolean;
};

/**
 * Side panel for the puzzle editor.
 * Provides board transform actions (rotate, flip), clipboard copy,
 * and a save button (localhost only) that writes directly to static puzzles.
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

  const formatted = useMemo(() =>
    formatPuzzle({
      name: puzzle.value.name,
      slug: puzzle.value.slug,
      createdAt: puzzle.value.createdAt ?? new Date(Date.now()),
      board,
    }), [puzzle.value, board]);

  const onCopy = useCallback(() => {
    navigator.clipboard.writeText(formatted);
    setMessage("markdown copied to clipboard!");
  }, [formatted]);

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

  return (
    <Panel>
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
            <i className="ph-flip-horizontal ph" /> Mirror
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
            <i className="ph-flip-vertical ph" /> Mirror
          </button>
        </div>

        <div className="flex flex-col place-items-start flex-wrap gap-fl-1">
          {message && (
            <p className="text-fl-0 text-purple-1 leading-tight">
              {message}
            </p>
          )}

          <button
            type="button"
            className="btn"
            onClick={onCopy}
          >
            <i className="ph-copy ph" /> Copy text
          </button>

          {isDev && (
            <button
              type="button"
              className="btn"
              onClick={onSave}
            >
              <i className="ph-floppy-disk ph" /> Save
            </button>
          )}
        </div>
      </div>
    </Panel>
  );
}
