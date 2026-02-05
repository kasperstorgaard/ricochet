import { useEffect, useRef } from "preact/hooks";

import { cn } from "#/lib/style.ts";

type Props = {
  open: boolean;
};

export function CookieBanner({ open }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    // Only show if no tracking cookie exists
    if (open) ref.current?.showModal();
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={ref}
      open
      className={cn(
        "fixed bottom-fl-2 left-fl-2 right-auto z-50 overflow-hidden max-w-88",
      )}
    >
      {/* Bitten cookie decoration */}
      <svg
        className="absolute -top-4 -right-3 w-18 h-18 opacity-80 pointer-events-none"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <clipPath id="cookie-bites">
            <path
              d="M 50 0
                    A 50 50 0 1 1 50 100
                    A 50 50 0 1 1 50 0
                    M 15 60 a 15 15 0 1 0 0 0.01"
              fill-rule="evenodd"
            />
          </clipPath>
        </defs>
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="var(--color-ui-2)"
          clip-path="url(#cookie-bites)"
        />
      </svg>

      <div className="grid gap-fl-1 relative z-10">
        <h2 className="text-3 font-medium flex items-center gap-1">
          Obligatory cookie thingy
        </h2>

        <p className="text-1">
          We don't share or sell your data, but if you want, we'd like to see
          how people use this thing. <a href="/cookie-policy">Learn more</a>
        </p>

        <form
          action="/api/consent"
          method="POST"
          className="flex gap-fl-1 pt-fl-1"
        >
          <button
            type="submit"
            name="action"
            value="accept"
            className="btn text-1"
          >
            sure, why not
          </button>

          <button
            type="submit"
            name="action"
            value="decline"
            className="btn text-1"
          >
            nah, I'm good
          </button>
        </form>
      </div>
    </dialog>
  );
}
