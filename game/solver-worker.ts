import { bfsGen } from "#/game/solver.ts";
import type { Board } from "#/game/types.ts";

// Runs BFS synchronously in a worker thread and posts SolverEvents back.
// No setTimeout yielding needed — the worker has its own event loop.
self.onmessage = (e: MessageEvent<Board>) => {
  try {
    for (const event of bfsGen(e.data, {})) {
      self.postMessage(event);
      if (event.type === "solution") return;
    }
  } catch (err) {
    self.postMessage({
      type: "error",
      message: err instanceof Error ? err.message : "Solver failed",
    });
  }
};
