import type { SolverEvent } from "#/game/solver.ts";
import { Board } from "#/game/types.ts";

/**
 * Reads a streaming SSE response from POST /api/solve and yields events.
 */
export async function* readSolveStream(
  board: Board,
): AsyncGenerator<SolverEvent> {
  const response = await fetch("/api/solve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(board),
  });

  if (!response.ok) {
    yield { type: "error", message: await response.text() };
    return;
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const messages = buffer.split("\n\n");
    buffer = messages.pop() ?? "";

    for (const message of messages) {
      const dataLine = message.split("\n").find((line) =>
        line.startsWith("data: ")
      );
      if (!dataLine) continue;

      yield JSON.parse(dataLine.slice(6)) as SolverEvent;
    }
  }
}
