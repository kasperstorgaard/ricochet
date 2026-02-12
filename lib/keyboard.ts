import { useEffect } from "preact/hooks";

import type { Direction } from "#/util/types.ts";

type UseArrowKeysOptions = {
  isEnabled?: boolean;
  onArrowKey: (direction: Direction) => void;
};

export function useArrowKeys(
  { isEnabled, onArrowKey }: UseArrowKeysOptions,
) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowUp":
          return onArrowKey("up");
        case "ArrowRight":
          return onArrowKey("right");
        case "ArrowDown":
          return onArrowKey("down");
        case "ArrowLeft":
          return onArrowKey("left");
      }
    };

    if (isEnabled) {
      self.addEventListener("keyup", handler);
    }

    return () => {
      self.removeEventListener("keyup", handler);
    };
  }, [isEnabled, onArrowKey]);
}

type useGameShortcutsOptions = {
  onSubmit?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onReset?: () => void;
  onHint?: () => void;
};

/**
 * Registers keyboard shortcuts for in-game actions.
 * Keys:
 * - Enter → submit
 * - u → undo
 * - U → reset
 * - r → redo
 * - h -> hint
 *
 * Shortcuts are suppressed when focus is inside an input element.
 */
export function useGameShortcuts(
  { onSubmit, onUndo, onRedo, onReset, onHint }: useGameShortcutsOptions,
) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      // If the event originated from an input, let it do it's thing.
      const input = (event.target as HTMLElement).closest("input");
      if (input != null) return;

      switch (event.key) {
        case "Enter":
          return onSubmit?.();
        case "u":
          return onUndo?.();
        case "U":
          return onReset?.();
        case "r":
          return onRedo?.();
        case "h":
          return onHint?.();
      }
    };

    self.addEventListener("keyup", handler);

    return () => {
      self.removeEventListener("keyup", handler);
    };
  }, [onSubmit, onUndo, onRedo, onReset]);
}
