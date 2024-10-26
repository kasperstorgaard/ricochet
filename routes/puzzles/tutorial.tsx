import { useSignal } from "@preact/signals";
import Board from "#/islands/board.tsx";
import { Puzzle, type Solution } from "#/db/types.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { ControlsPanel } from "#/islands/controls-panel.tsx";
import { getPuzzle, getPuzzleSolution } from "#/db/kv.ts";
import { Header } from "#/components/header.tsx";
import { TutorialDialog } from "#/islands/tutorial-dialog.tsx";
import { encodeState } from "#/util/url.ts";

type Data = {
  puzzle: Puzzle;
  solution: Solution;
};

export const handler: Handlers<Data> = {
  async GET(_req, ctx) {
    const puzzleId = Deno.env.get("TUTORIAL_PUZZLE_ID");
    if (!puzzleId) throw new Error("Tutorial puzzle not found");

    const solutionId = Deno.env.get("TUTORIAL_PUZZLE_SOLUTION_ID");
    if (!solutionId) throw new Error("Tutorial puzzle solution not found");

    const puzzle = await getPuzzle(puzzleId);
    if (!puzzle) throw new Error(`Unable to find puzzle with id: ${puzzleId}`);

    const solution = await getPuzzleSolution(puzzleId, solutionId);
    if (!solution) {
      throw new Error(`Unable to find puzzle solution id: ${puzzleId}`);
    }

    if (!ctx.url.searchParams.has("m")) {
      const redirectUrl = new URL(ctx.url);
      redirectUrl.search = encodeState({
        ...solution,
        cursor: 0,
      });
      return Response.redirect(redirectUrl, 301);
    }

    return ctx.render({ puzzle, solution });
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
      <div class="flex flex-col col-[2/3] w-full gap-fl-2">
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
