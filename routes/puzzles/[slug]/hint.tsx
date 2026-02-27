import { HttpError } from "fresh";

import { define } from "#/core.ts";
import { resolveMoves } from "#/game/board.ts";
import { getHintCount, getStoredPuzzle, setHintCount } from "#/game/cookies.ts";
import { getPuzzle } from "#/game/loader.ts";
import { getHint } from "#/game/solver.ts";
import { encodeMoves } from "#/game/strings.ts";
import { Puzzle } from "#/game/types.ts";
import { decodeState } from "#/game/url.ts";
import { isDev } from "#/lib/env.ts";
import { posthog } from "#/lib/posthog.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const { cookieChoice, trackingId } = ctx.state;

    const url = new URL(ctx.req.url);
    const slug = ctx.params.slug;
    url.pathname = `/puzzles/${slug}`;

    const state = decodeState(url);

    let puzzle: Puzzle | null = null;

    if (slug === "preview") {
      puzzle = getStoredPuzzle(ctx.req.headers);
    } else {
      puzzle = await getPuzzle(ctx.url.origin, slug);
    }

    if (!puzzle) {
      throw new HttpError(500, "Unable to get puzzle");
    }

    const hintCount = getHintCount(ctx.req.headers);
    const hintLimit = getHintLimit(puzzle.difficulty);

    // Guard against usage if hint limit is exceeded
    if (!isDev && slug !== "preview" && hintCount >= hintLimit) {
      return Response.redirect(url.href, 303);
    }

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
        puzzle_min_moves: puzzle.minMoves,
        game_moves: moves?.length,
      },
    });

    url.searchParams.set("hint", encodeMoves([hint]));

    const headers = new Headers();

    setHintCount(headers, {
      path: `/puzzles/${slug}`,
      value: hintCount + 1,
    });

    headers.set("Location", url.href);

    return new Response(null, { headers, status: 303 });
  },
});

function getHintLimit(difficulty: string | undefined) {
  return difficulty === "easy" ? 3 : 1;
}
