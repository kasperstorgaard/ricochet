import { FreshContext } from "$fresh/server.ts";
import { Piece, Wall } from "../../util/board.ts";

/**
 * Required data:
 * - puzzle id
 * - current board state (stringified)
 * - desired move
 *
 * Returns:
 * - puzzle id
 * - updated board state
 * - number of moves
 * - if the puzzle is solved
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
