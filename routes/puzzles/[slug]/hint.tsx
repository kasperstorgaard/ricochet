import { define } from "#/core.ts";
import { resolveMoves } from "#/util/board.ts";
import { getPuzzle } from "#/util/loader.ts";
import { getHint } from "#/util/solver.ts";
import { encodeMoves } from "#/util/strings.ts";
import { decodeState } from "#/util/url.ts";
import { posthog } from "#/lib/posthog.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const { cookieChoice, trackingId } = ctx.state;

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

    posthog?.capture({
      event: "hint_requested",
      distinctId: trackingId,
      properties: {
        $current_url: ctx.req.url,
        $process_person_profile: cookieChoice === "accepted",

        puzzle_slug: slug,
        puzzle_difficulty: puzzle.difficulty,
        game_moves: moves?.length,
      },
    });

    url.pathname = `/puzzles/${slug}`;
    url.searchParams.set("hint", encodeMoves([hint]));

    return Response.redirect(url.href);
  },
});
