import type { SolverEvent } from "#/game/solver.ts";

/**
 * Reads a streaming SSE response from POST /api/solve and yields events.
 */
export async function* readSolveStream(
  board: unknown,
): AsyncGenerator<SolverEvent> {
  const res = await fetch("/api/solve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(board),
  });

  if (!res.ok) {
    yield { type: "error", message: await res.text() };
    return;
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buf += decoder.decode(value, { stream: true });

    const messages = buf.split("\n\n");
    buf = messages.pop() ?? "";

    for (const message of messages) {
      const dataLine = message.split("\n").find((l) => l.startsWith("data: "));
      if (!dataLine) continue;

      yield JSON.parse(dataLine.slice(6)) as SolverEvent;
    }
  }
}
