import { useSignal } from "@preact/signals";
import Board from "#/islands/board.tsx";
import { Puzzle, type Solution } from "#/db/types.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { ControlsPanel } from "#/islands/controls-panel.tsx";
import { Header } from "#/components/header.tsx";
import { TutorialDialog } from "#/islands/tutorial-dialog.tsx";
import { decodeState } from "#/util/url.ts";
import { getPuzzle } from "#/util/loader.ts";
import { setSkipTutorialCookie } from "#/util/cookies.ts";

type Data = {
  puzzle: Puzzle;
  solution: Omit<Solution, "id" | "name">;
};

export const handler: Handlers<Data> = {
  async GET(_req, ctx) {
    const solutionRaw = Deno.env.get("TUTORIAL_SOLUTION");
    if (!solutionRaw) throw new Error("Tutorial puzzle solution not found");

    const redirectUrl = new URL(ctx.url);
    redirectUrl.searchParams.set("m", solutionRaw);

    const puzzle = await getPuzzle("tutorial");
    if (!puzzle) throw new Error("Tutorial puzzle not found");

    if (!ctx.url.searchParams.has("m")) {
      return Response.redirect(redirectUrl);
    }

    const { moves } = decodeState(redirectUrl);

    return ctx.render({
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
};

export default function PuzzleTutorial(props: PageProps<Data>) {
  const href = useSignal(props.url.href);
  const puzzle = useSignal(props.data.puzzle);
  const mode = useSignal<"readonly" | "replay">(
    props.url.searchParams.has("r") ? "replay" : "readonly",
  );

  const navItems = [
    { name: "home", href: "/" },
  ];

  return (
    <>
      <div class="flex flex-col col-[2/3] w-full gap-fl-2 pt-fl-2">
        <Header items={navItems} />

        <h1 className="text-5 text-brand">{puzzle.value.name}</h1>

        <Board
          href={href}
          puzzle={puzzle}
          mode={mode}
        />
      </div>

      <ControlsPanel href={href} />

      <TutorialDialog href={href} mode={mode} solution={props.data.solution} />
    </>
  );
}
