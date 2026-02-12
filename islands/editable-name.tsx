import { slug as slugify } from "@annervisser/slug";
import type { Signal } from "@preact/signals";
import { useRef } from "preact/hooks";
import clsx from "clsx/lite";

import type { Puzzle } from "#/util/types.ts";

type EditableNameProps = {
  puzzle: Signal<Puzzle>;
  defaultValue: string;
  className?: string;
};

// Contenteditable heading that updates the puzzle name on input.
export function EditableName(
  { puzzle, defaultValue, className }: EditableNameProps,
) {
  const textRef = useRef<HTMLSpanElement>(null);

  return (
    <h1
      className={clsx("flex items-center gap-fl-1", className)}
    >
      <span
        ref={textRef}
        contentEditable
        onBlur={(e) => {
          const name = e.currentTarget.textContent?.trim() ?? "";
          if (name !== puzzle.value.name) {
            puzzle.value = {
              ...puzzle.value,
              slug: slugify(name),
              name,
            };
          }
        }}
        tabIndex={0}
      >
        {puzzle.value.name || defaultValue}
      </span>

      <button
        type="button"
        aria-label="edit name"
        onClick={() => textRef.current?.focus()}
        className="flex items-center bg-transparent m-0 p-0"
      >
        <i className="ph-pencil-simple ph text-text-2 text-fl-0" />
      </button>
    </h1>
  );
}
