import { useSignal } from "@preact/signals";
import { Puzzle } from "#/db/types.ts";
import Board from "#/islands/board.tsx";
import { EditorPanel } from "#/islands/editor-panel.tsx";
import { Handlers, PageProps } from "$fresh/server.ts";
import { createPuzzle, getPuzzle } from "#/db/kv.ts";
import { Header } from "#/components/Header.tsx";

export const handler: Handlers<Puzzle> = {
  async GET(_req, ctx) {
    const { puzzleId } = ctx.params;

    if (puzzleId) {
      const puzzle = await getPuzzle(puzzleId);
      if (!puzzle) {
        throw new Error(`Unable to find puzzle with id: ${puzzleId}`);
      }

      return ctx.render(puzzle);
    }

    return ctx.render({
      id: "",
      name: "",
      board: {
        destination: { x: 0, y: 0 },
        pieces: [],
        walls: [],
      },
    });
  },

  async POST(req) {
    const form = await req.formData();
    const name = form.get("name")?.toString();

    const rawBoard = form.get("board")?.toString() ?? "";
    const board = JSON.parse(rawBoard) as Puzzle["board"];

    if (!name) throw new Error("Must provide a username");

    const puzzle = await createPuzzle({ name, board });

    const url = new URL(req.url);
    url.pathname = `puzzles/${puzzle?.id}`;
    return Response.redirect(url);
  },
};

export default function NewPuzzlePage(props: PageProps<Puzzle>) {
  const puzzle = useSignal(props.data);
  const href = useSignal(props.url.href);
  const hasSolution = useSignal(false);

  const navItems = [
    { name: "home", href: "/" },
    { name: "puzzles", href: "/puzzles/" },
  ];

  return (
    <>
      <div class="flex flex-col col-[2/3] w-full gap-fl-2">
        <Header items={navItems} />

        <h1 className="text-5 text-brand">Editor</h1>

        <Board
          puzzle={puzzle}
          href={href}
          hasSolution={hasSolution}
          isEditorMode
        />
      </div>

      <EditorPanel puzzle={puzzle} href={href} />
    </>
  );
}
