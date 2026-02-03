import { useEffect } from "preact/hooks";

type useGameShortcutsOptions = {
  onSubmit?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onReset?: () => void;
};

export function useGameShortcuts(
  { onSubmit, onUndo, onRedo, onReset }: useGameShortcutsOptions,
) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      // If the event originated from an input, let it do it's thing.
      const input = (event.target as HTMLElement).closest("input");
      if (input != null) return;

      switch (event.key) {
        case "Enter":
          return onSubmit?.();
        case "u":
          return onUndo?.();
        case "U":
          return onReset?.();
        case "r":
          return onRedo?.();
      }
    };

    self.addEventListener("keyup", handler);

    return () => {
      self.removeEventListener("keyup", handler);
    };
  }, [onSubmit, onUndo, onRedo, onReset]);
}
