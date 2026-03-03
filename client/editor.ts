import { type Signal } from "@preact/signals";
import { useCallback } from "preact/hooks";

import { isPositionSame } from "#/game/board.ts";
import type { Position, Puzzle, Wall } from "#/game/types.ts";

/**
 * Current state for the editor
 */
type UseEditorOptions = {
  // The puzzle being edited (empty board for new puzzles)
  puzzle: Signal<Puzzle>;
  // The active position, eg. the cell the user has selected
  active?: Position;
};

/**
 * Hook for editor functionality.
 * Returns handlers for mutating the board at the active position.
 */
export function useEditor(
  { active, puzzle }: UseEditorOptions,
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
    (type: "puck" | "blocker" | null) => {
      if (!active) return;

      // find existing match of same position and type
      const match = type &&
        puzzle.value.board.pieces.find((piece) =>
          isPositionSame(piece, active) && type === piece.type
        );

      // Clear pieces at the active position
      let pieces = puzzle.value.board.pieces.filter((piece) =>
        !isPositionSame(piece, active)
      );

      // Puck is unique — remove any existing puck at other positions
      if (type === "puck") {
        pieces = pieces.filter((piece) => piece.type !== "puck");
      }

      if (type && !match) {
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
      togglePieceType("blocker");
    } else if (activePiece.type === "blocker") {
      togglePieceType("puck");
    } else {
      togglePieceType(null);
    }
  }, [active, puzzle]);

  return { toggleWall, togglePieceType, setDestination, cycleWall, cyclePiece };
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
