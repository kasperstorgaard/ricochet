import clsx from "clsx/lite";
import { page } from "fresh";

import { Header } from "#/components/header.tsx";
import { Main } from "#/components/main.tsx";
import { Panel } from "#/components/panel.tsx";
import { PuzzleCard } from "#/components/puzzle-card.tsx";
import { define } from "#/core.ts";
import { getLatestPuzzle, getRandomPuzzle } from "#/game/loader.ts";
import { Puzzle } from "#/game/types.ts";

type PageData = {
  dailyPuzzle: Puzzle;
  randomPuzzle?: Puzzle;
};

export const handler = define.handlers<PageData>({
  async GET(ctx) {
    const { onboarding } = ctx.state;

    const dailyPuzzle = await getLatestPuzzle(ctx.url.origin);

    if (onboarding === "new") {
      return page({ dailyPuzzle });
    }

    const randomPuzzle = await getRandomPuzzle(ctx.url.origin, {
      excludeSlugs: [dailyPuzzle.slug],
      difficulty: onboarding === "started" ? ["easy"] : undefined,
    });

    return page({ dailyPuzzle, randomPuzzle });
  },
});

export default define.page<typeof handler>(function Home(ctx) {
  const url = new URL(ctx.req.url);

  const { dailyPuzzle, randomPuzzle } = ctx.data;
  const { onboarding } = ctx.state;

  return (
    <>
      <Main className="max-lg:row-span-full items-stretch place-content-stretch lg:pb-fl-4">
        <Header url={url} share themePicker />

        <div className="flex flex-col gap-1 py-fl-1 pt-fl-2">
          <h1 className="text-fl-3 leading-flat text-brand flex items-baseline gap-fl-1">
            Skub
            <span className="text-fl-0 text-text-3 font-normal">[ˈsgɔb]</span>
          </h1>

          <p className="text-text-2 text-fl-0">
            Slide pieces to reach the target. No stops, no turns.<br />Fewest
            moves wins.
          </p>
        </div>

        <ul
          className={clsx(
            "p-0 grid grid-cols-[repeat(2,1fr)] gap-fl-2 gap-y-fl-3 list-none",
            "md:grid-cols-[repeat(3,1fr)] max-lg:max-w-120",
          )}
        >
          <li className="list-none pl-0 min-w-0">
            <PuzzleCard puzzle={dailyPuzzle} tagline="Daily puzzle" />
          </li>

          <li className="list-none pl-0 min-w-0">
            {onboarding === "new"
              ? (
                <a
                  href="/puzzles/tutorial"
                  className={clsx(
                    "group flex gap-fl-1 p-fl-2 place-content-start place-items-center",
                    "text-text-2 leading-snug border border-link no-underline",
                    "lg:aspect-square lg:flex-col lg:justify-center lg:place-items-start lg:gap-fl-1 lg:w-full",
                    "hover:filter-[lighten(1.3)] hover:no-underline",
                  )}
                >
                  Tutorial
                  <i className="ph ph-arrow-right" />
                </a>
              )
              : (
                <PuzzleCard
                  puzzle={randomPuzzle!}
                  tagline={onboarding === "started"
                    ? "Warm-up puzzle"
                    : "Random puzzle"}
                />
              )}
          </li>

          <li className="list-none pl-0 min-w-0 max-lg:col-span-2 max-lg:place-self-start">
            <a
              href="/puzzles"
              className={clsx(
                "group flex gap-fl-1 p-fl-2 place-content-start place-items-center",
                "text-text-2 leading-snug border border-link no-underline",
                "lg:aspect-square lg:flex-col lg:justify-center lg:place-items-start lg:gap-fl-1 lg:w-full",
                "hover:filter-[lighten(1.3)] hover:no-underline",
              )}
            >
              Puzzle archives <i className="ph ph-arrow-right" />
            </a>
          </li>
        </ul>
      </Main>

      <Panel className="max-lg:gap-fl-3">
        <p className="col-[2/3] text-fl-0 text-text-2 lg:col-auto lg:row-start-1">
          Inspired by{" "}
          <a href="https://boardgamegeek.com/boardgame/51/ricochet-robots">
            Ricochet Robots
          </a>
        </p>

        <div
          className={clsx(
            "col-[2/3] flex flex-col gap-fl-1 justify-between items-start flex-wrap text-text-2",
            "sm:flex-row sm:items-center",
            "lg:col-auto lg:row-start-3 lg:flex-col lg:items-stretch",
          )}
        >
          <div
            className={clsx(
              "flex flex-wrap gap-fl-1 items-start",
              "lg:flex-col lg:items-stretch",
            )}
          >
            {
              /*
              TODO: add an "Extras" page that surfaces power-user features in
              one place — printing to play offline, remixing puzzles,
              contributing, keyboard shortcuts, etc.
              Link to it here as a secondary text link.
            */
            }
          </div>
          <div className="flex gap-2 lg:flex-col">
            <a
              href="https://github.com/kasperstorgaard/ricochet"
              className="text-text-2"
            >
              <i className="ph ph-github-logo" /> GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/kasper-storgaard-t-lead"
              className="text-text-2"
            >
              <i className="ph ph-linkedin-logo" /> LinkedIn
            </a>
          </div>
        </div>
      </Panel>
    </>
  );
});
