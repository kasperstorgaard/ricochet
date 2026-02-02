import { useSignal } from "@preact/signals";
import Board from "#/islands/board.tsx";
import { Puzzle } from "#/util/types.ts";
import { isValidSolution, resolveMoves } from "#/util/board.ts";
import { page, PageProps } from "fresh";
import { ControlsPanel } from "#/islands/controls-panel.tsx";
import { addSolution } from "#/db/kv.ts";
import { getPuzzle } from "../../../util/loader.ts";
import { Header } from "#/components/header.tsx";
import { Main } from "#/components/main.tsx";
import { define } from "../../core.ts";

export const handler = define.handlers<Puzzle>({
  async GET(ctx) {
    const { slug } = ctx.params;

    const puzzle = await getPuzzle(ctx.url.origin, slug);
    if (!puzzle) throw new Error(`Unable to find puzzle with slug: ${slug}`);

    return page(puzzle);
  },
  async POST(ctx) {
    const req = ctx.req;
    const { slug } = ctx.params;

    const form = await req.formData();
    const name = form.get("name")?.toString();

    if (!name) throw new Error("Must provide a username");

    const puzzle = await getPuzzle(ctx.url.origin, slug);
    if (!puzzle) throw new Error(`Puzzle with id: ${slug} not found`);

    const rawMoves = form.get("moves")?.toString() ?? "";
    const moves = JSON.parse(rawMoves);

    if (!isValidSolution(resolveMoves(puzzle.board, moves))) {
      throw new Error("Solution is not valid");
    }

    const solution = await addSolution({ puzzleSlug: slug, name, moves });
    const url = new URL(req.url);
    url.pathname = `puzzles/${slug}/solutions/${solution.id}`;

    return Response.redirect(url.href, 302);
  },
});

export default define.page(function PuzzleDetails(props: PageProps<Puzzle>) {
  const href = useSignal(props.url.href);
  const puzzle = useSignal(props.data);
  const mode = useSignal<"solve">("solve");

  const navItems = [
    { name: "home", href: "/" },
    { name: "puzzles", href: "/puzzles" },
  ];

  return (
    <>
      <Main>
        <Header items={navItems} />

        <h1 className="text-5 text-brand">{props.data.name}</h1>

        <Board href={href} puzzle={puzzle} mode={mode} />
      </Main>

      <ControlsPanel href={href} />
    </>
  );
});
