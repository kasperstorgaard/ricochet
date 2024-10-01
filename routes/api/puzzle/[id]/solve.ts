import { FreshContext } from "$fresh/server.ts";
import { Piece, Wall } from "../../../../util/board.ts";

/**
 * Required data:
 * - current board state
 * - desired board state
 *
 * Returns:
 * - original board state
 * - new board state
 * - if the puzzle is solved
 * - if the move is valid
 */
export const handler = async (
  req: Request,
  ctx: FreshContext,
): Promise<Response> => {
  const data = await req.json() as {};

  // verify that puzzle id exists
  // verify board state

  return new Response();
};
