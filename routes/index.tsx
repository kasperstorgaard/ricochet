import { Header } from "#/components/header.tsx";
import { define } from "#/core.ts";
import { getSkipTutorialCookie } from "#/util/cookies.ts";
import { getPuzzleOfTheDay } from "#/util/loader.ts";
import { context } from "npm:esbuild@~0.25.5";

export const handler = define.handlers({
  async GET(ctx) {
    const req = ctx.req;
    const skipTutorial = getSkipTutorialCookie(req.headers);
    const redirectUrl = new URL(req.url);

    if (!skipTutorial) {
      redirectUrl.pathname = "/puzzles/tutorial";
      return Response.redirect(redirectUrl);
    }

    const puzzle = await getPuzzleOfTheDay(ctx.url.origin);

    redirectUrl.pathname = `puzzles/${puzzle.slug}`;
    return Response.redirect(redirectUrl);
  },
});

export default define.page(function Home(ctx) {
  const url = new URL(ctx.req.url);

  const navItems = [
    { name: "home", href: "/" },
    { name: "puzzles", href: "/puzzles" },
  ];

  return (
    <div class="flex flex-col col-[2/3] w-full gap-fl-2 pt-fl-2">
      <Header url={url} items={navItems} />
      <div className="flex gap-fl-1">
        <section className="flex flex-col gap-fl-1">
          <h2 class="text-fl-2">New to the game?</h2>
          <p>
            Try{"  "}
            <a className="text-link underline" href="/puzzles/tutorial">
              the tutorial
            </a>
          </p>
        </section>
      </div>
    </div>
  );
});

/**
 * Ideas:
 * - add a keyboard navigation hint for desktop
 * - add a touch navigation hint for mobile
 * - ripple fade in of board and pieces, from the outside in, or top to bottom
 * - can't get enough, buy the boardgame (ask for forgiveness, not permission)
 * - store played games in session, to give players new unplayed games.
 */
