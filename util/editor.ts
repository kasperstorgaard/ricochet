import { useCallback, useEffect } from "preact/hooks";
import { Board, Position } from "#/db/types.ts";
import type { Signal } from "@preact/signals";
import { isPositionSame } from "#/util/board.ts";

type UseEditorOptions = {
  active: Position | null;
  state: Signal<Board>;
  isEnabled: boolean;
};

export function useEditor(
  { active, state, isEnabled }: UseEditorOptions,
) {
  const cycleWall = useCallback(() => {
    if (!active) return;

    let { walls } = state.value;
    const activeWalls = state.value.walls.filter((wall) =>
      isPositionSame(wall, active)
    );

    if (activeWalls.length === 0) {
      walls.push({ ...active, orientation: "horizontal" });
    } else if (
      activeWalls.length === 1 && activeWalls[0].orientation === "horizontal"
    ) {
      walls = walls.map((wall) =>
        isPositionSame(wall, active)
          ? { ...active, orientation: "vertical" }
          : wall
      );
    } else if (
      activeWalls.length === 1 && activeWalls[0].orientation === "vertical"
    ) {
      walls.push({ ...active, orientation: "horizontal" });
    } else {
      walls = walls.filter((wall) => !isPositionSame(wall, active));
    }

    state.value = {
      ...state.value,
      walls,
    };
  }, [active, state.value]);

  const cyclePiece = useCallback(() => {
    if (!active) return;

    let { pieces } = state.value;
    const activePiece = pieces.find((piece) => isPositionSame(piece, active));

    if (!activePiece) {
      pieces.push({ ...active, type: "bouncer" });
    } else if (activePiece.type === "bouncer") {
      pieces = pieces.map((piece) =>
        isPositionSame(piece, active)
          ? {
            ...active,
            type: "rook",
          }
          : piece
      );
    } else {
      pieces = pieces.filter((piece) => !isPositionSame(piece, active));
    }

    state.value = {
      ...state.value,
      pieces,
    };
  }, [active, state.value]);

  const setDestination = useCallback(() => {
    if (!active) return;

    state.value = {
      ...state.value,
      destination: active,
    };
  }, [active, state.value]);

  useEffect(() => {
    const onKeyUp = (event: KeyboardEvent) => {
      switch (event.key) {
        case "w":
          return cycleWall();
        case "p":
          return cyclePiece();
        case "d":
          return setDestination();
      }
    };

    if (active && isEnabled) {
      self.addEventListener("keyup", onKeyUp);
    }

    return () => {
      self.removeEventListener("keyup", onKeyUp);
    };
  }, [active, isEnabled, cyclePiece, cycleWall, setDestination]);
}
