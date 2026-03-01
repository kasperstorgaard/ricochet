import clsx from "clsx/lite";
import { page } from "fresh";

import { Header } from "#/components/header.tsx";
import { Main } from "#/components/main.tsx";
import { Panel } from "#/components/panel.tsx";
import { Thumbnail } from "#/components/thumbnail.tsx";
import { define } from "#/core.ts";
import { getSkipTutorialCookie } from "#/game/cookies.ts";
import { getPuzzleOfTheDay, getRandomPuzzle } from "#/game/loader.ts";
import { Puzzle } from "#/game/types.ts";

type PageData = {
  dailyPuzzle: Puzzle;
  randomPuzzle: Puzzle;
};

export const handler = define.handlers<PageData>({
  async GET(ctx) {
    const req = ctx.req;
    const skipTutorial = getSkipTutorialCookie(req.headers);

    if (!skipTutorial) {
      const redirectUrl = new URL(req.url);
      redirectUrl.pathname = "/puzzles/tutorial";

      return Response.redirect(redirectUrl, 303);
    }

    const today = new Date(Date.now());

    // Using NextJS-style promise splits to avoid waterfalls
    // (slightly overkill in this case, but good practice / safer for future additions)
    const dailyPuzzlePromise = getPuzzleOfTheDay(ctx.url.origin, today, {
      difficulty: ["medium", "hard"],
    });
    const randomPuzzlePromise = dailyPuzzlePromise.then((puzzle) =>
      getRandomPuzzle(ctx.url.origin, {
        difficulty: ["medium", "hard"],
        excludeSlugs: [puzzle.slug],
      })
    );

    const [dailyPuzzle, randomPuzzle] = await Promise.all([
      dailyPuzzlePromise,
      randomPuzzlePromise,
    ]);

    return page({ dailyPuzzle, randomPuzzle });
  },
});

export default define.page<typeof handler>(function Home(ctx) {
  const url = new URL(ctx.req.url);

  const { dailyPuzzle, randomPuzzle } = ctx.data;

  return (
    <>
      <Main className="max-lg:row-span-full items-stretch place-content-stretch lg:pb-fl-4">
        <Header url={url} />

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
            <a
              href={`puzzles/${dailyPuzzle.slug}`}
              className="group flex flex-col gap-fl-1 text-text-1 hover:text-brand hover:no-underline"
            >
              <div
                className={clsx(
                  "flex border-1 border-surface-4",
                  "group-hover:border-brand transition-colors",
                )}
              >
                <Thumbnail
                  board={dailyPuzzle.board}
                  difficulty={dailyPuzzle.difficulty}
                  class="basis-0 grow aspect-square h-full"
                />
              </div>

              <div className="flex gap-fl-2 justify-between items-start">
                <div className="flex flex-col gap-0.5">
                  <span className="text-0 text-text-2 group-hover:text-current tracking-wide leading-flat">
                    Daily puzzle
                  </span>
                  <span className="flex flex-wrap text-2 leading-tight font-4">
                    {dailyPuzzle.name}
                  </span>
                </div>
              </div>
            </a>
          </li>

          <li className="list-none pl-0 min-w-0">
            <a
              href={`puzzles/${randomPuzzle.slug}`}
              className="group flex flex-col gap-fl-1 text-text-1 hover:text-brand hover:no-underline"
            >
              <div
                className={clsx(
                  "flex border-1 border-surface-4",
                  "group-hover:border-brand transition-colors",
                )}
              >
                <Thumbnail
                  board={randomPuzzle.board}
                  difficulty={randomPuzzle.difficulty}
                  class="basis-0 grow aspect-square h-full"
                />
              </div>

              <div className="flex gap-fl-2 justify-between items-start">
                <div className="flex flex-col gap-0.5">
                  <span className="text-0 text-text-2 group-hover:text-current tracking-wide leading-flat">
                    Random puzzle
                  </span>
                  <span className="flex flex-wrap text-2 leading-tight font-4">
                    {randomPuzzle.name}
                  </span>
                </div>
              </div>
            </a>
          </li>

          <li className="list-none pl-0 min-w-0 max-lg:col-span-2 max-lg:place-self-start">
            <a
              href="/puzzles"
              className={clsx(
                "group flex gap-fl-1 p-fl-2 place-content-start place-items-center",
                "text-text-1 leading-snug border border-surface-4 hover:border-brand",
                "lg:aspect-square lg:flex-col lg:justify-center lg:place-items-start lg:gap-fl-1 lg:w-full",
                "hover:text-brand hover:no-underline",
              )}
            >
              Puzzle archives <i className="ph ph-arrow-right" />
            </a>
          </li>
        </ul>
      </Main>

      <Panel className="max-lg:gap-fl-2">
        <p className="col-[2/3] text-fl-0 text-text-3 lg:col-auto lg:row-start-1">
          Inspired by{" "}
          <a href="https://boardgamegeek.com/boardgame/51/ricochet-robots">
            Ricochet Robots
          </a>
        </p>

        <div
          className={clsx(
            "col-[2/3] flex flex-col gap-fl-2 justify-between items-start flex-wrap text-fl-0 text-text-2",
            "sm:flex-row sm:items-center",
            "lg:col-auto lg:row-start-3 lg:flex-col lg:items-start",
          )}
        >
          <div className="flex gap-fl-1 lg:flex-col max-md:text-fl-1">
            <a
              href="https://github.com/kasperstorgaard/ricochet"
              className="flex gap-1 items-center"
            >
              <i className="ph ph-github-logo" /> GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/kasper-storgaard-t-lead"
              className="flex gap-1 items-center "
            >
              <i className="ph ph-linkedin-logo" /> LinkedIn
            </a>
          </div>

          <div
            className={clsx(
              "flex flex-wrap gap-fl-1 items-start",
              "lg:flex-col",
            )}
          >
            <a href="/puzzles/tutorial" className="btn">
              How do I play?
            </a>
            <a href={`/puzzles/${dailyPuzzle.slug}?print`} className="btn">
              Print daily puzzle
            </a>
          </div>
        </div>
      </Panel>
    </>
  );
});
