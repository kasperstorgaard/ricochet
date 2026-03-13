import { define } from "#/core.ts";
import type { SolverEvent } from "#/game/solver.ts";
import type { Board } from "#/game/types.ts";

export const handler = define.handlers({
  async POST(ctx) {
    const board = await ctx.req.json() as Board;

    // solver-worker.js is bundled to static/ by the solverWorker Vite plugin.
    // Constructing from the request origin works on both local dev and Deploy.
    const workerUrl = new URL("/solver-worker.js", ctx.url);
    console.log("[solve] workerUrl:", workerUrl.href);
    const worker = new Worker(workerUrl, { type: "module" });

    const encode = new TextEncoder().encode.bind(new TextEncoder());

    const stream = new ReadableStream({
      start(controller) {
        worker.postMessage(board);

        worker.onmessage = (e: MessageEvent<SolverEvent>) => {
          console.log("[solve] worker message:", e.data.type);
          controller.enqueue(encode(`data: ${JSON.stringify(e.data)}\n\n`));
          if (e.data.type === "solution" || e.data.type === "error") {
            worker.terminate();
            controller.close();
          }
        };

        worker.onerror = (e) => {
          console.error(
            "[solve] worker error:",
            e.message,
            "filename:",
            e.filename,
            "line:",
            e.lineno,
            "col:",
            e.colno,
          );
          const event: SolverEvent = { type: "error", message: e.message };
          controller.enqueue(encode(`data: ${JSON.stringify(event)}\n\n`));
          worker.terminate();
          controller.close();
        };
      },
      cancel() {
        worker.terminate();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  },
});
