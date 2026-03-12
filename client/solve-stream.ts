import { useCallback, useEffect, useRef } from "preact/hooks";

import type { SolverEvent } from "#/game/solver.ts";
import type { Board } from "#/game/types.ts";

/**
 * Reads a streaming SSE response from POST /api/solve and yields events.
 * Pass an AbortSignal to cancel the request mid-stream.
 */
export async function* readSolveStream(
  board: Board,
  signal?: AbortSignal,
): AsyncGenerator<SolverEvent> {
  const response = await fetch("/api/solve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(board),
    signal,
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

/**
 * Manages a streaming solve request with proper cancellation and cleanup.
 * Call `start(board)` to begin solving; any previous in-flight solve is
 * cancelled first. Cancels automatically on unmount.
 */
export function useSolveStream(
  onEvent: (event: SolverEvent) => void,
): { start: (board: Board) => void; cancel: () => void } {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const controllerRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
  }, []);

  const start = useCallback((board: Board) => {
    cancel();
    const controller = new AbortController();
    controllerRef.current = controller;

    (async () => {
      try {
        for await (const event of readSolveStream(board, controller.signal)) {
          if (controller.signal.aborted) break;
          onEventRef.current(event);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          onEventRef.current({
            type: "error",
            message: err instanceof Error ? err.message : "Solve failed",
          });
        }
      }
    })();
  }, [cancel]);

  // Cancel any in-flight request on unmount
  useEffect(() => () => cancel(), []);

  return { start, cancel };
}
