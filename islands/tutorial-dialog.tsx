import type { Signal } from "@preact/signals";
import { clsx } from "clsx/lite";
import { useEffect, useMemo } from "preact/hooks";

import type { Solution } from "#/db/types.ts";
import { getReplaySpeed } from "#/game/url.ts";
import { Dialog } from "#/islands/dialog.tsx";

type Props = {
  href: Signal<string>;
  mode: Signal<"replay" | "readonly">;
  solution: Omit<Solution, "id" | "name">;
  open?: boolean;
};

export function TutorialDialog({ open, href, mode, solution }: Props) {
  const step = useMemo(() => {
    const url = new URL(href.value);
    const rawValue = url.searchParams.get("step");
    const value = rawValue && parseInt(rawValue, 10);

    return !value || isNaN(value) ? 0 : value;
  }, [href.value]);

  const replaySpeed = useMemo(
    () => getReplaySpeed(href.value) ?? 1,
    [href.value],
  );

  useEffect(() => {
    mode.value = step === 2 ? "replay" : "readonly";
  }, [step]);

  return (
    <Dialog
      open={open}
      className={clsx(
        "[animation-fill-mode:forwards]",
        "backdrop:[animation-delay:inherit] backdrop:[animation-fill-mode:forwards]",
        step === 2 &&
          "opacity-0 animate-fade-in backdrop:opacity-0 backdrop:animate-fade-in",
      )}
      style={{
        animationDelay: `${(1 / replaySpeed) * solution.moves.length}s`,
      }}
    >
      {step === 0 && <TutorialWelcomeStep href={href.value} open={open} />}
      {step === 1 && <TutorialPiecesStep href={href.value} />}
      {step === 2 && (
        <TutorialSolutionStep href={href.value} solution={solution} />
      )}
    </Dialog>
  );
}

type TutorialStepProps = {
  href: string;
  open?: boolean;
};

function TutorialWelcomeStep({ href, open }: TutorialStepProps) {
  const nextStep = useMemo(() => getStepLink(href, 1), [
    href,
  ]);

  return (
    <>
      <div className="flex flex-col gap-fl-2 text-text-2">
        <h1 className="text-fl-2 leading-flat text-text-1">
          Welcome to <strong className="text-ui-2">Skub!</strong>
        </h1>

        <p>
          A tiny puzzle game where you slide pieces into walls and each other to
          get the puck to the target — in as few moves as possible.
        </p>

        <p className="text-text-3 text-fl-min">
          <em>Skub</em> [ˈsgɔb] means "push" in Danish.
        </p>
      </div>

      <form
        action={href}
        method="POST"
        className="flex w-full"
      >
        <button
          type="submit"
          className="btn mr-auto"
          disabled={!open}
        >
          Dismiss
        </button>

        <a
          href={nextStep}
          className="btn ml-auto"
          data-router="push"
        >
          Next
        </a>
      </form>
    </>
  );
}

function TutorialPiecesStep({ href }: TutorialStepProps) {
  const prevStep = useMemo(() => getStepLink(href, 0), [href]);
  const nextStep = useMemo(() => getStepLink(href, 2, { replaySpeed: 1 }), [
    href,
  ]);

  return (
    <>
      <div className="flex flex-col gap-fl-2 text-text-2">
        <h1 className="text-fl-2 leading-tight text-text-1">The pieces</h1>
        <p>
          There are two pieces: the puck <IconPuck /> and the blocker{" "}
          <IconBlocker />. Both slide until they hit each other or a
          wa<span className="text-ui-4">ll</span>.
        </p>

        <p>
          Get the puck to stop on the target <IconDestination />{" "}
          and you've found a solution.
        </p>
      </div>

      <div className="flex w-full gap-fl-1 flex-wrap justify-between">
        <a
          href={prevStep}
          className="btn"
          data-router="push"
        >
          Previous
        </a>

        <a
          href={nextStep}
          className="btn"
          data-router="push"
        >
          Show me!
        </a>
      </div>
    </>
  );
}

function TutorialSolutionStep({ href }: TutorialStepProps & {
  solution: Omit<Solution, "id" | "name">;
}) {
  const prevStep = useMemo(() => getStepLink(href, 1), [href]);
  const reloadStep = useMemo(
    () => getStepLink(href, 2, { replaySpeed: 0.667 }),
    [href],
  );

  return (
    <>
      <div className="flex flex-col gap-fl-2 text-text-2">
        <h1 className="text-fl-2 leading-tight text-text-1">
          Finding a solution
        </h1>
        <p>
          That's one way to solve it.{" "}
          <a
            href={reloadStep}
            type="submit"
          >
            Show again
          </a>
        </p>

        <p>
          Every puzzle has many solutions, each ranked by number of moves.
        </p>

        <p>
          You can see the number of moves in the control panel{" "}
          <span className="max-lg:hidden">on the right</span>
          <span className="lg:hidden">below</span>, where you can also undo
          moves, get a hint, or start over.
        </p>
      </div>

      <form
        action={href}
        method="POST"
        className="flex w-full gap-fl-1 flex-wrap justify-between"
      >
        <a
          href={prevStep}
          className="btn"
          data-router="push"
        >
          Previous
        </a>

        <button
          type="submit"
          className="btn"
        >
          Let's go!
        </button>
      </form>
    </>
  );
}

type GetStepLinkOptions = {
  replaySpeed?: number;
};

function getStepLink(
  href: string,
  step: number,
  { replaySpeed }: GetStepLinkOptions = {},
) {
  const url = new URL(href);
  url.searchParams.set("step", step.toString());

  if (replaySpeed) url.searchParams.set("replay_speed", replaySpeed.toString());

  return url.href;
}

function IconPuck() {
  return (
    <svg viewBox="0 0 50 50" className="inline size-[1em] align-[-0.125em]">
      <circle cx="25" cy="25" r="20" fill="var(--color-ui-2)" />
    </svg>
  );
}

function IconBlocker() {
  return (
    <svg viewBox="0 0 50 50" className="inline size-[1em] align-[-0.125em]">
      <rect
        x="5"
        y="5"
        width="40"
        height="40"
        rx="6"
        ry="6"
        fill="var(--color-ui-3)"
      />
    </svg>
  );
}

function IconDestination() {
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 border border-ui-1">
      <i className="ph-x ph text-ui-1 text-[1.3em]" />
    </span>
  );
}
