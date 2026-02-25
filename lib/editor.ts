import { type Signal } from "@preact/signals";
import { useCallback, useEffect } from "preact/hooks";

import { isPositionSame } from "#/util/board.ts";
import { subscribeToStore } from "#/lib/editor-store.ts";
import type { Position, Puzzle, Wall } from "#/util/types.ts";

/**
 * Current state for the editor
 */
type UseEditorOptions = {
  // The puzzle being edited (empty board for new puzzles)
  puzzle: Signal<Puzzle>;
  // The active position, eg. the cell the user has selected
  active?: Position;
  // If the editor is enabled — binds keyboard shortcuts when true
  isEnabled: boolean;
};

/**
 * Hook for editor functionality.
 * Returns handlers for mutating the board at the active position.
 * When `isEnabled` is true, also binds keyboard shortcuts (W/P/D).
 */
export function useEditor(
  { active, puzzle, isEnabled }: UseEditorOptions,
) {
  const toggleWall = useCallback(
    (target: Wall["orientation"] | "both" | null) => {
      if (!active) return;

      // store matches of the active position
      const matches = puzzle.value.board.walls.filter((wall) =>
        isPositionSame(wall, active)
      );

      // clear the walls matching active as a starting point
      let walls = puzzle.value.board.walls.filter((wall) =>
        !isPositionSame(wall, active)
      );

      // No target, clear walls
      if (!target) {
        updateBoard(puzzle, { walls });
        return;
      }

      // Target is the same as current matches, clear walls
      if (
        (matches.length === 1 && matches[0].orientation === target) ||
        (target === "both" && matches.length === 2)
      ) {
        updateBoard(puzzle, { walls });
        return;
      }

      // Add whatever walls are desired
      if (target === "both" || target === "horizontal") {
        walls = [...walls, { ...active, orientation: "horizontal" as const }];
      }

      if (target === "both" || target === "vertical") {
        walls = [...walls, { ...active, orientation: "vertical" as const }];
      }

      updateBoard(puzzle, { walls });
    },
    [active, puzzle],
  );

  const togglePieceType = useCallback(
    (type: "rook" | "bouncer" | null) => {
      if (!active) return;

      let pieces = puzzle.value.board.pieces.filter((piece) =>
        !isPositionSame(piece, active)
      );

      if (type) {
        pieces = [...pieces, { ...active, type }];
      }

      updateBoard(puzzle, { pieces });
    },
    [active, puzzle],
  );

  const setDestination = useCallback(() => {
    if (!active) return;
    updateBoard(puzzle, { destination: active });
  }, [active, puzzle]);

  const cycleWall = useCallback(() => {
    if (!active) return;

    const { walls } = puzzle.value.board;
    const activeWalls = walls.filter((wall) => isPositionSame(wall, active));

    if (activeWalls.length === 0) {
      toggleWall("horizontal");
    } else if (
      activeWalls.length === 1 &&
      activeWalls[0].orientation === "horizontal"
    ) {
      toggleWall("vertical");
    } else if (
      activeWalls.length === 1 &&
      activeWalls[0].orientation === "vertical"
    ) {
      toggleWall("both");
    } else {
      toggleWall(null);
    }
  }, [active, puzzle]);

  const cyclePiece = useCallback(() => {
    if (!active) return;

    const { pieces } = puzzle.value.board;
    const activePiece = pieces.find((piece) => isPositionSame(piece, active));

    if (!activePiece) {
      togglePieceType("bouncer");
    } else if (activePiece.type === "bouncer") {
      togglePieceType("rook");
    } else {
      togglePieceType(null);
    }
  }, [active, puzzle]);

  // -- keyboard binding --

  useEffect(() => {
    const onKeyUp = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.isContentEditable || target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA"
      ) {
        return;
      }

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

  // Subscribe to puzzle changes and persist to cookie via /api/store.
  // Only runs when isEnabled is true (board instance), not the toolbar.
  useEffect(() => {
    if (!isEnabled) return;
    return subscribeToStore(puzzle);
  }, []);

  return { toggleWall, togglePieceType, setDestination };
}

// Applies a board mutation to the puzzle signal, clearing minMoves.
function updateBoard(
  puzzle: Signal<Puzzle>,
  patch: Partial<Puzzle["board"]>,
) {
  puzzle.value = {
    ...puzzle.value,
    board: { ...puzzle.value.board, ...patch },
    minMoves: undefined,
  };
}
