import { HttpError } from "fresh";

import { define } from "#/core.ts";
import { addSolution, listPuzzleSolutions } from "#/db/kv.ts";
import { resolveMoves } from "#/game/board.ts";
import { getHintCount, setHintCount } from "#/game/cookies.ts";
import { getPuzzle } from "#/game/loader.ts";
import { solve } from "#/game/solver.ts";
import { encodeMoves } from "#/game/strings.ts";
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

    if (slug === "preview") return Response.redirect(url.href, 303);

    const puzzle = await getPuzzle(ctx.url.origin, slug);

    if (!puzzle) {
      throw new HttpError(500, "Unable to get puzzle");
    }

    const hintCount = getHintCount(ctx.req.headers);
    const hintLimit = getHintLimit(puzzle.difficulty);

    if (!isDev && hintCount >= hintLimit) {
      throw new HttpError(400, "Hint limit exceeded");
    }

    const moves = state.moves.slice(0, state.cursor ?? state.moves.length);

    let [solution] = await listPuzzleSolutions(slug, {
      bySequence: moves,
      limit: 1,
    });

    if (!solution) {
      const board = moves.length
        ? resolveMoves(puzzle.board, moves)
        : puzzle.board;
      const nextMoves = solve(board);

      solution = await addSolution({
        puzzleSlug: slug,
        name: "Solver",
        moves: [...moves, ...nextMoves],
        isGenerated: true,
      });
    }

    const hint = solution.moves[moves.length];

    posthog?.capture({
      event: "hint_requested",
      distinctId: trackingId,
      properties: {
        $current_url: ctx.req.url,
        $process_person_profile: cookieChoice === "accepted",

        puzzle_slug: slug,
        puzzle_difficulty: puzzle.difficulty,
        puzzle_min_moves: puzzle.minMoves,
        game_moves: state.cursor,
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
