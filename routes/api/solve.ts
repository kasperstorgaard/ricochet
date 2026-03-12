import { define } from "#/core.ts";
import { validateBoard } from "#/game/board.ts";
import type { SolverEvent } from "#/game/solver.ts";
import type { Board } from "#/game/types.ts";

// POST endpoint that streams solve progress as SSE events.
// BFS runs in a Web Worker so the main event loop stays unblocked.
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
    const worker = new Worker(
      new URL("../../game/solver-worker.ts", import.meta.url),
      { type: "module" },
    );

    const stream = new ReadableStream({
      start(controller) {
        const send = (data: SolverEvent) =>
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
          );

        worker.postMessage(board);

        worker.onmessage = (e: MessageEvent<SolverEvent>) => {
          send(e.data);
          if (e.data.type === "solution" || e.data.type === "error") {
            worker.terminate();
            controller.close();
          }
        };

        worker.onerror = (e) => {
          send({ type: "error", message: e.message });
          worker.terminate();
          controller.close();
        };
      },
      cancel() {
        worker.terminate();
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream" },
    });
  },
});
