import { define } from "#/core.ts";
import type { SolverEvent } from "#/game/solver.ts";
import type { Board } from "#/game/types.ts";

// Resolves to a file:// URL at runtime, bypassing Deno Deploy's
// --cached-only restriction (which only blocks HTTP module fetches).
// The Vite plugin copies solver-worker.js to _fresh/server/assets/
// alongside this compiled route so the relative path resolves correctly.
const workerUrl = new URL("./solver-worker.js", import.meta.url);

const encoder = new TextEncoder();
const encode = encoder.encode.bind(encoder);

export const handler = define.handlers({
  async POST(ctx) {
    const board = await ctx.req.json() as Board;

    const worker = new Worker(workerUrl, { type: "module" });

    const stream = new ReadableStream({
      start(controller) {
        worker.onmessage = (e: MessageEvent<SolverEvent>) => {
          controller.enqueue(encode(`data: ${JSON.stringify(e.data)}\n\n`));
          if (e.data.type === "solution" || e.data.type === "error") {
            worker.terminate();
            controller.close();
          }
        };

        worker.onerror = (e) => {
          const event: SolverEvent = { type: "error", message: e.message };
          controller.enqueue(encode(`data: ${JSON.stringify(event)}\n\n`));
          worker.terminate();
          controller.close();
        };

        worker.postMessage(board);
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
