import { useCallback, useEffect } from "preact/hooks";
import { Position, Puzzle } from "#/util/types.ts";
import type { Signal } from "@preact/signals";
import { isPositionSame } from "#/util/board.ts";

type UseEditorOptions = {
  puzzle: Signal<Puzzle>;
  active?: Position;
  isEnabled: boolean;
};

export function useEditor(
  { active, puzzle, isEnabled }: UseEditorOptions,
) {
  const cycleWall = useCallback(() => {
    if (!active) return;

    let { walls } = puzzle.value.board;
    const activeWalls = puzzle.value.board.walls.filter((wall) =>
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

    puzzle.value = {
      ...puzzle.value,
      board: {
        ...puzzle.value.board,
        walls,
      },
    };
  }, [active, puzzle.value.board]);

  const cyclePiece = useCallback(() => {
    if (!active) return;

    let { pieces } = puzzle.value.board;
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

    puzzle.value = {
      ...puzzle.value,
      board: {
        ...puzzle.value.board,
        pieces,
      },
    };
  }, [active, puzzle.value]);

  const setDestination = useCallback(() => {
    if (!active) return;

    puzzle.value = {
      ...puzzle.value,
      board: {
        ...puzzle.value.board,
        destination: active,
      },
    };
  }, [active, puzzle.value]);

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
