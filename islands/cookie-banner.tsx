import { clsx } from "clsx/lite";
import { posthog } from "posthog-js";
import { TargetedSubmitEvent } from "preact";

type Props = {
  // Whether the banner should be shown (true when user hasn't made a choice).
  open: boolean;
};

/**
 * Cookie consent banner displayed at the bottom of the page.
 * Submits to /api/consent with action "accept" or "decline".
 */
export function CookieBanner({ open }: Props) {
  if (!open) return null;

  return (
    <div
      className={clsx(
        "fixed top-auto bottom-0 left-0 max-w-screen right-0 p-fl-2 m-0 z-5",
        "rounded-cond-2 overflow-hidden bg-surface-2",
        "sm:max-w-88 max-lg:shadow-3",
        "md:bottom-fl-2 md:left-fl-2 md:right-auto",
        "animate-sneak-in-bottom",
        "md:animate-sneak-in-left",
      )}
    >
      {/* Simple circle with a bite taken out */}
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
        <h2 className="text-2 font-semibold flex items-center gap-1">
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
            // Opt in to client side tracking
            onClick={() => posthog.opt_in_capturing()}
          >
            sure, why not
          </button>

          <button
            type="submit"
            name="action"
            value="decline"
            className="btn text-1"
            // Opt out of client side tracking
            onClick={() => posthog.opt_out_capturing()}
          >
            nah, I'm good
          </button>
        </form>
      </div>
    </div>
  );
}
