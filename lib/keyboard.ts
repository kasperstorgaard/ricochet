import { useEffect } from "preact/hooks";

export type Direction = "up" | "right" | "down" | "left";

type UseArrowKeysOptions = {
  onKeyUp: (direction: Direction) => void;
};

export function useArrowKeys({ onKeyUp }: UseArrowKeysOptions) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowUp":
          return onKeyUp("up");
        case "ArrowRight":
          return onKeyUp("right");
        case "ArrowDown":
          return onKeyUp("down");
        case "ArrowLeft":
          return onKeyUp("left");
      }
    };

    self.addEventListener("keyup", handler);

    return () => {
      self.removeEventListener("keyup", handler);
    };
  }, [onKeyUp]);
}
