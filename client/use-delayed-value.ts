import { useRef, useState } from "preact/hooks";
const DEFAULT_DELAY = 1000;

type SetValueOptions = {
  immediate?: boolean;
  delay?: number;
};

/**
 * Adds values to the queue, and shifts from the front on a delay.
 * Useful when work happens too fast for the user, and needs to be slower for them to perceieve.
 *
 * Keeps the order and offers custom delay and an option to immediately clear the queue.
 */
export function useDelayedValue<T>(
  initialValue: T,
) {
  const queue = useRef<{ delay: number; value: T }[]>([]);
  const [value, setValue] = useState<T | null>(initialValue);
  const [isShifting, setIsShifting] = useState(false);
  const timer = useRef<number | null>(null);

  const clearQueue = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setIsShifting(false);
    queue.current = [];
  };

  const queueShift = () => {
    if (!queue.current.length) {
      clearQueue();
      return;
    }

    const next = queue.current.shift();

    timer.current = setTimeout(() => {
      setValue(next?.value ?? null);

      if (queue.current.length > 0) queueShift();
    }, next?.delay);

    setIsShifting(true);
  };

  const queueValue = (
    value: T,
    options?: SetValueOptions,
  ) => {
    if (options?.immediate) {
      clearQueue();
      setValue(value);
      return;
    }

    const delay = options?.delay ?? DEFAULT_DELAY;
    queue.current.push({ value, delay });
    if (!timer.current) queueShift();
  };

  return { value, isShifting, queueValue, clearQueue };
}
