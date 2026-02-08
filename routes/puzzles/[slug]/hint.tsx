import { define } from "#/core.ts";
import { resolveMoves } from "#/util/board.ts";
import { getPuzzle } from "#/util/loader.ts";
import { getHint } from "#/util/solver.ts";
import { encodeMoves } from "#/util/strings.ts";
import { decodeState } from "../../../util/url.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const url = new URL(ctx.req.url);
    const slug = ctx.params.slug;
    url.pathname = `/puzzles/${slug}`;

    const state = decodeState(url);

    const puzzle = await getPuzzle(ctx.url.origin, slug);

    const moves = state.moves
      ? state.moves.slice(0, state.cursor ?? state.moves.length)
      : null;
    const board = moves?.length
      ? resolveMoves(puzzle.board, moves)
      : puzzle.board;
    const hint = getHint(board);

    url.pathname;

    if (hint) {
      url.searchParams.set("hint", encodeMoves([hint]));
    } else {
      url.searchParams.set("error", "no_hint");
    }

    return Response.redirect(url.href);
  },
});
