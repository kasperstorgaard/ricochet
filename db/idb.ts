import { del, get, set, update } from "idb-keyval";
import { Move, Puzzle } from "./types.ts";

export async function getPuzzle(id: string) {
  const puzzle = await get<Puzzle>(`puzzles:${id}`);
  return puzzle ?? null;
}

export async function setPuzzle(data: Omit<Puzzle, "id">) {
  const id = crypto.randomUUID();
  const puzzle = { id, ...data };

  await set(`puzzle:${id}`, puzzle);

  return puzzle;
}

export async function deletePuzzle(id: string) {
  await del(`puzzle:${id}`);
}

export async function pushMove(puzzleId: string, move: Move) {
  await update<Move[]>(
    `puzzle:${puzzleId}:moves`,
    (val) => val ? [...val, move] : [move],
  );
}

export async function popMove(puzzleId: string) {
  let move: Move | null = null;

  await update<Move[]>(
    `puzzle:${puzzleId}:moves`,
    (val) => {
      move = (val ?? []).pop() ?? null;
      return val ?? [];
    },
  );

  return move;
}

export async function getMoves(puzzleId: string) {
  const result = await get<Move[]>(`puzzle:${puzzleId}:moves`);
  return result ?? null;
}
