import { Puzzle } from "#/util/types.ts";
import type { Signal } from "@preact/signals";
import { useMemo, useState } from "preact/hooks";
import { decodeState, encodeState } from "#/util/url.ts";
import { resolveMoves } from "#/util/board.ts";
import { formatPuzzle } from "#/util/formatter.ts";
import { Panel } from "#/components/panel.tsx";

type EditorPanelProps = {
  href: Signal<string>;
  puzzle: Signal<Puzzle>;
};

export function EditorPanel({ puzzle, href }: EditorPanelProps) {
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

  const [isCopied, setIsCopied] = useState(false);

  const formatted = useMemo(() =>
    formatPuzzle({
      name: puzzle.value.name,
      slug: puzzle.value.slug,
      createdAt: puzzle.value.createdAt ?? new Date(Date.now()),
      board,
    }), [puzzle.value, board]);

  return (
    <Panel>
      <div className="flex flex-col col-[2/3] lg:row-[3/4] gap-fl-1">
        <button
          type="button"
          className="btn"
          onClick={() => {
            navigator.clipboard.writeText(
              formatted,
            );
            setIsCopied(true);
          }}
        >
          Copy markdown
        </button>
        {isCopied && (
          <p className="text-fl-0 text-purple-1 leading-tight">
            markdown copied to clipboard!
          </p>
        )}
      </div>
    </Panel>
  );
}
