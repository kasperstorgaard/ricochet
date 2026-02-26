import type { Signal } from "@preact/signals";
import { useMemo } from "preact/hooks";
import { useEditor } from "#/lib/editor.ts";
import type { Puzzle } from "#/util/types.ts";
import { decodeState } from "#/util/url.ts";
import clsx from "clsx/lite";

type EditorToolbarProps = {
  href: Signal<string>;
  puzzle: Signal<Puzzle>;
  className?: string;
};

/**
 * Toolbar for the puzzle editor.
 * On mobile: flows inline inside Main.
 * On desktop: breaks out to the right of Main via absolute positioning.
 */
export function EditorToolbar({ href, puzzle, className }: EditorToolbarProps) {
  const active = useMemo(
    () => decodeState(href.value).active,
    [href.value],
  );

  const { toggleWall, togglePieceType, setDestination } = useEditor({
    puzzle,
    active,
  });

  const disabled = active == null;

  return (
    <div
      className={clsx(
        "grid grid-cols-[repeat(6,2.5rem)] h-fit place-content-center",
        "border border-text-2 divide-x-1 divide-text-1",
        "lg:grid-cols-[auto_2.25rem] lg:auto-rows-[2.5rem] lg:divide-y-1 lg:divide-x-0",
        className,
      )}
    >
      <button
        type="button"
        className="p-1.5 bg-transparent lg:col-1"
        aria-label="Horizontal wall"
        disabled={disabled}
        onClick={() => toggleWall("horizontal")}
      >
        <div className="size-5 border-t-[3px] border-ui-4" />
      </button>

      <button
        type="button"
        className="flex items-center bg-transparent"
        aria-label="Vertical wall"
        disabled={disabled}
        onClick={() => toggleWall("vertical")}
      >
        <div className="size-5 border-l-[3px] border-ui-4" />
      </button>

      <button
        type="button"
        className="flex items-center bg-transparent"
        aria-label="Both walls"
        disabled={disabled}
        onClick={() => toggleWall("both")}
      >
        <div className="size-5 border-t-[3px] border-l-[3px] border-ui-4" />
      </button>

      <div
        className={clsx(
          "not-lg:hidden col-2 row-[1/4] flex items-center justify-center p-1",
          "border-l-1 border-l-text-2",
        )}
      >
        <kbd>
          W
        </kbd>
      </div>

      <button
        type="button"
        className="flex items-center justify-center bg-transparent"
        aria-label="Bouncer"
        disabled={disabled}
        onClick={() => togglePieceType("bouncer")}
      >
        <div className="size-4 bg-ui-3 rounded-1" />
      </button>

      <button
        type="button"
        className="flex items-center justify-center bg-transparent"
        aria-label="Rook"
        disabled={disabled}
        onClick={() => togglePieceType("rook")}
      >
        <div className="size-4 bg-ui-2 rounded-round" />
      </button>

      <div
        className={clsx(
          "not-lg:hidden col-2 row-start-4 row-span-2 flex items-center justify-center p-1",
          "border-l-1 border-l-text-2",
        )}
      >
        <kbd>
          P
        </kbd>
      </div>

      <button
        type="button"
        className="flex items-center justify-center bg-transparent"
        aria-label="Destination"
        disabled={disabled}
        onClick={setDestination}
      >
        <div className="size-5 border-2 border-ui-1 flex items-center justify-center">
          <i className="ph-x ph text-ui-1 text-fl-0" />
        </div>
      </button>

      <div
        className={clsx(
          "not-lg:hidden col-2 flex items-center justify-center p-1",
          "border-l-1 border-l-text-2",
        )}
      >
        <kbd>
          D
        </kbd>
      </div>
    </div>
  );
}
