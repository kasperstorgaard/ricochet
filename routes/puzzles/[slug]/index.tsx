import { useSignal } from "@preact/signals";
import clsx from "clsx/lite";
import { HttpError, page } from "fresh";

import { Header } from "#/components/header.tsx";
import { Main } from "#/components/main.tsx";
import { PrintPanel } from "#/components/print-panel.tsx";
import { define } from "#/core.ts";
import { addSolution } from "#/db/solutions.ts";
import { getPuzzleStats } from "#/db/stats.ts";
import { defaultPuzzleStats } from "#/game/stats.ts";
import { PuzzleStats } from "#/game/types.ts";
import {
  getUserCompleted,
  getUserPuzzleDraft,
  setUserCompleted,
  setUserOnboarding,
} from "#/db/user.ts";
import { isValidSolution, resolveMoves } from "#/game/board.ts";
import { getHintCount } from "#/game/cookies.ts";
import { getPuzzle } from "#/game/loader.ts";
import { Move, Puzzle } from "#/game/types.ts";
import Board from "#/islands/board.tsx";
import { ControlsPanel } from "#/islands/controls-panel.tsx";
import { DifficultyBadge } from "#/islands/difficulty-badge.tsx";
import { SolutionDialog } from "#/islands/solution-dialog.tsx";
import { isDev } from "#/lib/env.ts";
import { posthog } from "#/lib/posthog.ts";

type PageData = {
  puzzle: Puzzle;
  hintCount: number;
  puzzleStats: PuzzleStats;
};

export const handler = define.handlers<PageData>({
  async GET(ctx) {
    const { slug } = ctx.params;

    const hintCount = getHintCount(ctx.req.headers);

    if (!/^[a-z]+$/.test(slug)) {
      throw new HttpError(404, `Invalid puzzle slug: ${slug}`);
    }

    if (slug === "preview") {
      const puzzle = await getUserPuzzleDraft(ctx.state.userId);

      if (!puzzle) throw new HttpError(500, "No stored puzzle");

      puzzle.slug = "preview";
      puzzle.number = 0;

      return page({ puzzle, hintCount, puzzleStats: defaultPuzzleStats });
    }

    const puzzlePromise = getPuzzle(ctx.url.origin, slug);
    const puzzleStatsPromise = getPuzzleStats(slug);

    const [puzzle, puzzleStats] = await Promise.all([
      puzzlePromise,
      puzzleStatsPromise,
    ]);

    if (!puzzle) {
      throw new HttpError(404, `Unable to find puzzle with slug: ${slug}`);
    }

    // Stats are fetched at page load, so a user who takes a long time to solve
    // will see slightly stale numbers in the dialog. Acceptable — this is cosmetic.

    return page({ puzzle, hintCount, puzzleStats: puzzleStats ?? defaultPuzzleStats });
  },
  async POST(ctx) {
    const req = ctx.req;
    const { slug } = ctx.params;
    const referer = ctx.req.headers.get("referer");

    if (slug === "preview") {
      throw new HttpError(500, "Preview puzzle solutions cannot be submitted");
    }

    const form = await req.formData();
    const name = form.get("name")?.toString();

    const puzzle = await getPuzzle(ctx.url.origin, slug);
    if (!puzzle) {
      throw new HttpError(404, `Unable to find puzzle with slug: ${slug}`);
    }

    if (!name) throw new HttpError(400, "Must provide a username");

    const rawMoves = form.get("moves")?.toString() ?? "";
    const moves = JSON.parse(rawMoves) as Move[];

    if (!isValidSolution(resolveMoves(puzzle.board, moves))) {
      throw new HttpError(400, "Solution is not valid");
    }

    const solution = await addSolution({
      puzzleSlug: slug,
      name,
      moves,
      userId: ctx.state.userId,
    });
    const url = new URL(req.url);
    url.pathname = `puzzles/${slug}/solutions/${solution.id}`;

    posthog?.capture({
      distinctId: ctx.state.trackingId,
      event: "puzzle_solved",
      properties: {
        properties: {
          $current_url: referer,
          $process_person_profile: ctx.state.cookieChoice === "accepted",

          puzzle_slug: slug,
          puzzle_difficulty: puzzle.difficulty,
          puzzle_min_moves: puzzle.minMoves,
          game_moves: moves?.length,
        },
      },
    });

    const responseHeaders = new Headers({ Location: url.href });

    if (moves.length === puzzle.minMoves) {
      const completed = new Set(await getUserCompleted(ctx.state.userId));
      completed.add(slug);

      await setUserCompleted(ctx.state.userId, [...completed]);
    }

    // Complete onboarding on a good solve
    if (
      moves.length <= puzzle.minMoves * 1.33 &&
      ctx.state.onboarding !== "done"
    ) {
      await setUserOnboarding(ctx.state.userId, "done");

      posthog?.capture({
        distinctId: ctx.state.trackingId,
        event: "onboarding_completed",
        properties: {
          $current_url: referer,
          $process_person_profile: ctx.state.cookieChoice === "accepted",
          puzzle_slug: slug,
          game_moves: moves.length,
          puzzle_min_moves: puzzle.minMoves,
        },
      });
    }

    return new Response(null, { status: 303, headers: responseHeaders });
  },
});

export default define.page<typeof handler>(function PuzzleDetails(props) {
  const { slug } = props.params;

  const href = useSignal(props.url.href);
  const puzzle = useSignal(props.data.puzzle);
  const mode = useSignal<"solve">("solve");
  const printUrl = props.url.hostname + props.url.pathname;
  const isPreview = slug === "preview";

  const showMinMoves = props.state.featureFlags.minMoves ?? false;

  const url = new URL(props.req.url);

  return (
    <>
      <Main>
        <Header url={url} back={{ href: "/" }} share themePicker />

        <div className="flex items-center justify-between gap-fl-1 mt-2 flex-wrap">
          <h1 className="text-5 text-brand leading-tight">
            #{props.data.puzzle.number} {props.data.puzzle.name}
          </h1>

          <DifficultyBadge
            puzzle={puzzle}
            showMinMoves={showMinMoves}
            className="lg:mt-1"
          />
        </div>

        <Board href={href} puzzle={puzzle} mode={mode} />
      </Main>

      <ControlsPanel
        puzzle={puzzle}
        href={href}
        hintCount={props.data.hintCount}
        isDev={isDev}
        isPreview={isPreview}
        onboarding={props.state.onboarding}
        className="print:hidden"
      />

      <PrintPanel />

      <a
        href={`/puzzles/${props.data.puzzle.slug}`}
        className={clsx(
          "not-print:hidden",
          "fixed left-0 top-fl-3 py-fl-2",
          "[writing-mode:vertical-rl] text-fl-0 rotate-180 font-mono",
        )}
      >
        {printUrl}
      </a>

      <SolutionDialog
        href={href}
        puzzle={puzzle}
        isPreview={isPreview}
        onboarding={props.state.onboarding}
        stats={props.data.puzzleStats}
      />
    </>
  );
});
