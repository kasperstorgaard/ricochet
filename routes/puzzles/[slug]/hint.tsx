import { HttpError } from "fresh";

import { define } from "#/core.ts";
import { addSolve, listPuzzleSolves } from "#/db/solutions.ts";
import { incrementHintUsageCount } from "#/db/stats.ts";
import { resolveMoves } from "#/game/board.ts";
import { getHintCount, setHintCount } from "#/game/cookies.ts";
import { getPuzzle } from "#/game/loader.ts";
import { solveSync } from "#/game/solver.ts";
import { encodeMoves } from "#/game/strings.ts";
import { decodeState } from "#/game/url.ts";
import { isDev } from "#/lib/env.ts";
import { posthog } from "#/lib/posthog.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const { cookieChoice, trackingId } = ctx.state;

    const slug = ctx.params.slug;

    const state = decodeState(ctx.req.url);

    // Preview is an edge case page, and showcases full solution instead of using hints.
    if (slug === "preview") {
      throw new HttpError(500, "Hint not allowed in preview");
    }

    const puzzle = await getPuzzle(slug);
    if (!puzzle) throw new HttpError(404, "Unable to get puzzle");

    const hintCount = getHintCount(ctx.req.headers);
    const hintLimit = getHintLimit(puzzle.difficulty);
    const onboarding = ctx.state.user.onboarding;

    if (!isDev && onboarding === "done" && hintCount >= hintLimit) {
      throw new HttpError(400, "Hint limit exceeded");
    }

    const currentMoves = state.cursor != null
      ? state.moves.slice(0, state.cursor)
      : state.moves;

    // First, try to fetch the solution by sequence...
    let solves = await listPuzzleSolves(slug, {
      bySequence: currentMoves,
      limit: 1,
    });

    // ...falling back to a just-in-time solve
    if (!solves.length) {
      let board;
      try {
        board = resolveMoves(puzzle.board, currentMoves);
      } catch {
        // Redirect to a reset puzzle if we are in an invalid state
        return Response.redirect(new URL(`/puzzles/${slug}`, ctx.url), 303);
      }
      const nextMoves = solveSync(board);

      // and storing the generated solution
      const addedSolve = await addSolve({
        puzzleSlug: slug,
        moves: [...currentMoves, ...nextMoves],
      });

      solves = [addedSolve];
    }

    // hint requested is an important metric for engagement and to gauge difficulty
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

    // Best-effort — does not block the response
    incrementHintUsageCount(slug).catch(() => {});

    // Start building redirect response
    const url = new URL(ctx.req.url);
    url.pathname = `/puzzles/${slug}`;

    // hint is the move after the current moves
    const hint = solves[0].moves[currentMoves.length];
    url.searchParams.set("hint", encodeMoves([hint]));

    const headers = new Headers();

    // Update the hint count so the limit is not exceeded
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
