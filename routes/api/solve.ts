import { define } from "#/core.ts";
import { validateBoard } from "#/game/board.ts";
import { solveStream } from "#/game/solver.ts";
import type { Board } from "#/game/types.ts";

// POST endpoint that streams solve progress as SSE events.
// Used by the puzzle editor for long-running solves.
//
// Events:
//   data: {"type":"progress","depth":N,"states":N}
//   data: {"type":"solution","moves":[...]}
//   data: {"type":"error","message":"..."}
export const handler = define.handlers({
  async POST(ctx) {
    let board: Board;

    try {
      board = await ctx.req.json();
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    try {
      validateBoard(board);
    } catch {
      return new Response("Invalid Board", { status: 400 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: unknown) =>
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

        try {
          for await (const event of solveStream(board)) {
            send(event);
          }
        } catch (err) {
          send({ type: "error", message: err instanceof Error ? err.message : "Solver failed" });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream" },
    });
  },
});
