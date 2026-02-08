import { useEffect } from "preact/hooks";

export type Direction = "up" | "right" | "down" | "left";

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
