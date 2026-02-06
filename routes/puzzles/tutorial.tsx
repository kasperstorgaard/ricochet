import { useSignal } from "@preact/signals";
import { page, PageProps } from "fresh";

import { Header } from "#/components/header.tsx";
import { Main } from "#/components/main.tsx";
import { Solution } from "#/db/types.ts";
import Board from "#/islands/board.tsx";
import { ControlsPanel } from "#/islands/controls-panel.tsx";
import { TutorialDialog } from "#/islands/tutorial-dialog.tsx";
import { define } from "#/core.ts";
import { setSkipTutorialCookie } from "#/util/cookies.ts";
import { getPuzzle } from "#/util/loader.ts";
import { Puzzle } from "#/util/types.ts";
import { decodeState } from "#/util/url.ts";

type Data = {
  puzzle: Puzzle;
  solution: Omit<Solution, "id" | "name">;
};

export const handler = define.handlers<Data>({
  async GET(ctx) {
    const solutionRaw = Deno.env.get("TUTORIAL_SOLUTION");
    if (!solutionRaw) throw new Error("Tutorial puzzle solution not found");

    const redirectUrl = new URL(ctx.url);
    redirectUrl.searchParams.set("moves", solutionRaw);

    const puzzle = await getPuzzle(ctx.url.origin, "tutorial");
    if (!puzzle) throw new Error("Tutorial puzzle not found");

    if (!ctx.url.searchParams.has("moves")) {
      return Response.redirect(redirectUrl);
    }

    const { moves } = decodeState(redirectUrl);

    return page({
      puzzle,
      solution: {
        puzzleSlug: puzzle.slug,
        moves,
      },
    });
  },
  // dismiss dialog
  POST() {
    const headers = new Headers({
      // Redirect to home
      Location: "/",
    });

    setSkipTutorialCookie(headers, true);

    return new Response("", {
      status: 302,
      headers,
    });
  },
});

export default define.page(function PuzzleTutorial(props: PageProps<Data>) {
  const href = useSignal(props.url.href);
  const puzzle = useSignal(props.data.puzzle);
  const mode = useSignal<"readonly" | "replay">(
    props.url.searchParams.has("replay_speed") ? "replay" : "readonly",
  );

  const url = new URL(props.req.url);

  const navItems = [
    { name: "home", href: "/" },
  ];

  return (
    <>
      <Main>
        <Header url={url} items={navItems} />

        <h1 className="text-5 text-brand mt-2">{puzzle.value.name}</h1>

        <Board
          href={href}
          puzzle={puzzle}
          mode={mode}
        />
      </Main>

      <ControlsPanel href={href} />

      <TutorialDialog
        open
        href={href}
        mode={mode}
        solution={props.data.solution}
      />
    </>
  );
});
