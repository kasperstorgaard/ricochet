import { useSignal } from "@preact/signals";
import { Board as BoardState, Puzzle } from "#/db/types.ts";
import Board from "#/islands/board.tsx";
import { Handlers, PageProps } from "$fresh/server.ts";
import { EditorPanel } from "#/islands/editor-panel.tsx";

export const handler: Handlers<Puzzle> = {
  async GET(req, ctx) {
    const id = ctx.params.id;

    if (id) {
      const apiUrl = new URL(req.url);
      apiUrl.pathname = `api/puzzles/${id}`;

      const response = await fetch(apiUrl);
      const puzzle = await response.json() as Puzzle;
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
  async POST(req, ctx) {
    const form = await req.formData();
    const name = form.get("name")?.toString();

    const rawBoard = form.get("board")?.toString() ?? "";
    const board = JSON.parse(rawBoard);

    const apiUrl = new URL(req.url);
    apiUrl.pathname = "api/puzzles";

    const response = await fetch(apiUrl, {
      method: "POST",
      body: JSON.stringify({ name, board }),
    });

    const puzzle = await response.json() as Puzzle;

    return ctx.render(puzzle);
  },
};

export default function Home(props: PageProps<Puzzle>) {
  const board = useSignal<BoardState>(props.data?.board);

  return (
    <>
      <div class="flex flex-col col-[2/3] w-full gap-2 py-1">
        <Board state={board} isEditorMode />
      </div>

      <EditorPanel state={board} />
    </>
  );
}
