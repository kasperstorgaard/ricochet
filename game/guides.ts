import { getTargets, isMoveSame } from "./board.ts";
import { Board, Move, Position } from "./types.ts";

/** A move guide shown on the board, optionally flagged as a hint. */
export type Guide = {
  move: Move;
  isHint: boolean;
};

/**
 * Builds a list of move guides for the active piece.
 * Each guide represents a direction the piece can move, with a guide strip + target.
 * If a hint is provided and matches a target direction, it replaces that target.
 */
export function getGuides(
  board: Pick<Board, "pieces" | "walls">,
  { active, hint }: { active?: Position; hint?: Move },
): Guide[] {
  const result: Guide[] = [];
  const targets = active ? getTargets(active, board) : {};

  for (const target of Object.values(targets)) {
    result.push({ move: [active!, target], isHint: false });
  }

  if (hint) {
    const target = result.find((item) => isMoveSame(item.move, hint));
    const insertIdx = target ? result.indexOf(target) : result.length;
    result.splice(insertIdx, 1, { move: hint, isHint: true });
  }

  return result;
}
