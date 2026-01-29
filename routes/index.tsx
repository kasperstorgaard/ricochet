import { Handlers } from "$fresh/server.ts";
import { Header } from "#/components/header.tsx";
import { listPuzzles } from "#/util/loader.ts";

export const handler: Handlers = {
  async GET(req) {
    const puzzles = await listPuzzles();

    const redirectUrl = new URL(req.url);
    redirectUrl.pathname = `puzzles/${puzzles[0].slug}`;

    return Response.redirect(redirectUrl);
  },
};

export default function Home() {
  const navItems = [
    { name: "home", href: "/" },
    { name: "puzzles", href: "/puzzles/" },
  ];

  return (
    <div class="flex flex-col col-[2/3] w-full gap-fl-2 pt-fl-2">
      <Header items={navItems} />
      <div className="flex gap-fl-1">
        <section className="flex flex-col gap-fl-1">
          <h2 class="text-fl-2">New to the game?</h2>
          <p>
            Try{" "}
            <a className="text-link underline" href="/puzzles/tutorial">
              the tutorial
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}

/**
 * Ideas:
 * - require auth for editor
 * - redirect to game id of the day when landing on home
 * - add a keyboard navigation hint for desktop
 * - add a touch navigation hint for mobile
 * - ripple fade in of board and pieces, from the outside in, or top to bottom
 * - can't get enough, buy the boardgame (ask for forgiveness, not permission)
 * - store played games in session, to give players new unplayed games.
 */
