import { solve } from "#/game/solver.ts";
import type { SolverEvent } from "#/game/solver.ts";
import type { Board } from "#/game/types.ts";

self.onmessage = (e: MessageEvent<Board>) => {
  try {
    for (const event of solve(e.data)) {
      self.postMessage(event);
      if (event.type === "solution") return;
    }
  } catch (err) {
    const event: SolverEvent = {
      type: "error",
      message: err instanceof Error ? err.message : "Solver failed",
    };
    self.postMessage(event);
  }
};
