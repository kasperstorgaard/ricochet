import type { Signal } from "@preact/signals";
import { formatPuzzle } from "#/util/formatter.ts";
import type { Puzzle } from "#/util/types.ts";

const DEBOUNCE_MS = 600;

let timer: ReturnType<typeof setTimeout> | null = null;

/**
 * Subscribes to puzzle changes and debounces POSTs to /api/store.
 * Module-level singleton — safe to call from multiple islands.
 * Returns a cleanup/unsubscribe function.
 */
export function subscribeToStore(puzzle: Signal<Puzzle>) {
  return puzzle.subscribe((value) => {
    if (timer !== null) clearTimeout(timer);

    timer = setTimeout(async () => {
      timer = null;
      try {
        await fetch("/api/store", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ markdown: formatPuzzle(value) }),
        });
      } catch {
        // silently fail — store is best-effort
      }
    }, DEBOUNCE_MS);
  });
}
