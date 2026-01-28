import { useSignal } from "@preact/signals";
import Board from "#/islands/board.tsx";
import { Puzzle } from "#/db/types.ts";
import { isValidSolution, resolveMoves } from "#/util/board.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { ControlsPanel } from "#/islands/controls-panel.tsx";
import { addSolution, getPuzzle } from "#/db/kv.ts";
import { Header } from "#/components/header.tsx";

export const handler: Handlers<Puzzle> = {
  async GET(_req, ctx) {
    const { puzzleId } = ctx.params;

    const puzzle = await getPuzzle(puzzleId);
    if (!puzzle) throw new Error(`Unable to find puzzle with id: ${puzzleId}`);

    return ctx.render(puzzle);
  },
  async POST(req, ctx) {
    const { puzzleId } = ctx.params;

    const form = await req.formData();
    const name = form.get("name")?.toString();

    if (!name) throw new Error("Must provide a username");

    const puzzle = await getPuzzle(puzzleId);
    if (!puzzle) throw new Error(`Puzzle with id: ${puzzleId} not found`);

    const rawMoves = form.get("moves")?.toString() ?? "";
    const moves = JSON.parse(rawMoves);

    if (!isValidSolution(resolveMoves(puzzle.board, moves))) {
      throw new Error("Solution is not valid");
    }

    const solution = await addSolution({ puzzleId, name, moves });
    const url = new URL(req.url);
    url.pathname = `puzzles/${puzzleId}/solutions/${solution.id}`;

    return Response.redirect(url.href, 301);
  },
};

export default function PuzzleDetails(props: PageProps<Puzzle>) {
  const href = useSignal(props.url.href);
  const puzzle = useSignal(props.data);
  const mode = useSignal<"solve">("solve");

  const navItems = [
    { name: "home", href: "/" },
    { name: "puzzles", href: "/puzzles/" },
  ];

  return (
    <>
      <div class="flex flex-col col-[2/3] w-full gap-fl-2">
        <Header items={navItems} />

        <h1 className="text-5 text-brand">{props.data.name}</h1>

        <Board href={href} puzzle={puzzle} mode={mode} />
      </div>

      <ControlsPanel href={href} />
    </>
  );
}
