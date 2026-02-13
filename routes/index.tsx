import clsx from "clsx/lite";
import { page } from "fresh";

import { Header } from "#/components/header.tsx";
import { define } from "#/core.ts";
import { getSkipTutorialCookie } from "#/util/cookies.ts";
import { Main } from "#/components/main.tsx";
import { Panel } from "#/components/panel.tsx";
import { Thumbnail } from "#/components/thumbnail.tsx";
import { Puzzle } from "#/util/types.ts";
import { getPuzzleOfTheDay } from "#/util/loader.ts";

type PageData = {
  puzzleOfTheDay: {
    medium: Puzzle;
    hard: Puzzle;
  };
};

export const handler = define.handlers<PageData>({
  async GET(ctx) {
    const req = ctx.req;
    const skipTutorial = getSkipTutorialCookie(req.headers);

    if (!skipTutorial) {
      const redirectUrl = new URL(req.url);
      redirectUrl.pathname = "/puzzles/tutorial";

      return Response.redirect(redirectUrl);
    }

    const today = new Date(Date.now());

    const [medium, hard] = await Promise.all([
      getPuzzleOfTheDay(ctx.url.origin, today, { difficulty: [0, 7] }),
      getPuzzleOfTheDay(ctx.url.origin, today, { difficulty: [8, 20] }),
    ]);

    return page({
      puzzleOfTheDay: {
        medium,
        hard,
      },
    });
  },
});

export default define.page<typeof handler>(function Home(ctx) {
  const url = new URL(ctx.req.url);

  const { puzzleOfTheDay } = ctx.data;

  const navItems = [
    { name: "home", href: "/" },
  ];

  return (
    <>
      <Main className="max-lg:row-span-full items-stretch place-content-stretch lg:pb-fl-4">
        <Header url={url} items={navItems} />

        <div className="flex flex-col gap-1 lg:pt-fl-2">
          <h1 className="text-fl-3 leading-flat text-brand">
            Ricochet
          </h1>
          <p className="text-text-2 text-fl-0">
            A puzzle game based on{"  "}
            <a href="https://boardgamegeek.com/boardgame/51/ricochet-robots">
              Ricochet Robots
            </a>
          </p>
        </div>

        <ul
          className={clsx(
            "p-0 grid grid-cols-[repeat(2,1fr)] gap-fl-2",
            "list-none",
            "md:grid-cols-[repeat(3,1fr)] max-lg:max-w-120",
          )}
        >
          <li className="list-none pl-0 min-w-0">
            <a
              href={`puzzles/${puzzleOfTheDay.medium.slug}`}
              className={clsx(
                "group flex flex-col gap-fl-1 text-text-1 h-full",
                "hover:text-brand hover:no-underline",
              )}
            >
              <div
                className={clsx(
                  "flex border-1 border-surface-4",
                  "group-hover:border-brand transition-colors",
                )}
              >
                <Thumbnail
                  board={puzzleOfTheDay.medium.board}
                  class="basis-0 grow aspect-square h-full"
                />
              </div>

              <div className="flex flex-col">
                Daily puzzle
                <span className="text-text-2 text-fl-0 font-mono group-hover:text-current">
                  MEDIUM
                </span>
              </div>
            </a>
          </li>
          <li className="list-none pl-0 min-w-0">
            <a
              href={`puzzles/${puzzleOfTheDay.hard.slug}`}
              className={clsx(
                "group flex flex-col gap-fl-1 text-text-1",
                "hover:text-brand hover:no-underline",
              )}
            >
              <div
                className={clsx(
                  "flex border-1 border-surface-4",
                  "group-hover:border-brand transition-colors",
                )}
              >
                <Thumbnail
                  board={puzzleOfTheDay.hard.board}
                  class="basis-0 grow aspect-square h-full"
                />
              </div>

              <div className="flex flex-col">
                Daily puzzle
                <span className="text-text-2 text-fl-0 font-mono group-hover:text-current">
                  HARD
                </span>
              </div>
            </a>
          </li>
          <li className="list-none pl-0 min-w-0">
            <a
              href="/puzzles"
              className={clsx(
                "group flex flex-col gap-fl-1 text-text-1 p-fl-2 w-full place-content-center aspect-square col-span-2",
                "border border-text-3",
                "hover:text-brand hover:no-underline",
                "lg:col-span-1",
              )}
            >
              Browse all puzzles
            </a>
          </li>
        </ul>
      </Main>
      <Panel>
        <span />
      </Panel>
    </>
  );
});
