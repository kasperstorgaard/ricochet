import { define } from "#/core.ts";
import { solve } from "#/game/solver.ts";
import type { Board } from "#/game/types.ts";

export const handler = define.handlers({
  POST(ctx) {
    const encode = new TextEncoder().encode.bind(new TextEncoder());

    const stream = new ReadableStream({
      async start(controller) {
        let board: Board;

        try {
          board = await ctx.req.json() as Board;
        } catch {
          controller.enqueue(
            encode(
              `data: ${JSON.stringify({ type: "error", message: "Invalid JSON" })}\n\n`,
            ),
          );
          controller.close();
          return;
        }

        try {
          for (const event of solve(board, {})) {
            controller.enqueue(encode(`data: ${JSON.stringify(event)}\n\n`));
            if (event.type === "solution") break;
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : "Solver failed";
          controller.enqueue(
            encode(`data: ${JSON.stringify({ type: "error", message })}\n\n`),
          );
        }

        controller.close();
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
