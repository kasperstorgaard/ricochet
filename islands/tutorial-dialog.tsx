import type { Signal } from "@preact/signals";
import { useEffect, useMemo } from "preact/hooks";

import type { Solution } from "#/db/types.ts";
import { clsx } from "clsx/lite";
import { Dialog } from "#/islands/dialog.tsx";
import { getReplaySpeed } from "#/util/url.ts";

type Props = {
  href: Signal<string>;
  mode: Signal<"replay" | "readonly">;
  solution: Omit<Solution, "id" | "name">;
  open?: boolean;
};

export const TutorialDialog = function ({ open, href, mode, solution }: Props) {
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
};

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
          Welcome to <strong className="text-ui-2">Ricochet!</strong>
        </h1>

        <p>
          A tiny puzzle where you ricochet pieces against walls and each other
          to reach the target.
        </p>

        <p>
          The objective of the game is simple, get the rook to the target, in as
          few moves as possible.
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
          There are two pieces: the rook (<IconRook />) and the bouncer{" "}
          (<IconBouncer />).
        </p>

        <p>
          Both pieces move like a chess rook, but <strong>only</strong>{" "}
          stop when they hit each other or a wall (<IconWall />).
        </p>
        <p>
          When you get the rook (<IconRook />) to stop on the target{" "}
          (<IconDestination />), you have found a solution.
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
          That was a replay of a solution.<br />
          <a
            href={reloadStep}
            className="underline text-link"
            type="submit"
          >
            (Show again)
          </a>
        </p>

        <p>
          There are many solutions to each puzzle, and each solution is ranked
          based on the number of moves.
        </p>

        <p>
          You can see the number of moves in the control panel{" "}
          <span className="max-lg:hidden">on the right</span>
          <span className="lg:hidden">below</span>, where you can also undo/redo
          moves and reset the puzzle.
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
          Ok, I'm ready!
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

function IconRook() {
  return (
    <svg viewBox="0 0 50 50" className="inline w-5 h-5 align-middle">
      <circle cx="25" cy="25" r="20" fill="var(--color-ui-2)" />
    </svg>
  );
}

function IconBouncer() {
  return (
    <svg viewBox="0 0 50 50" className="inline w-5 h-5 align-middle">
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
    <svg viewBox="0 0 50 50" className="inline w-5 h-5 align-middle">
      <g stroke="var(--color-ui-1)" strokeWidth="3" fill="none">
        <rect x="5" y="5" width="40" height="40" />
        <line x1="5" y1="5" x2="45" y2="45" />
        <line x1="5" y1="45" x2="45" y2="5" />
      </g>
    </svg>
  );
}

function IconWall() {
  return (
    <svg viewBox="0 0 10 50" className="inline w-2 h-5 align-middle">
      <line
        x1="5"
        y1="5"
        x2="5"
        y2="45"
        strokeWidth="6"
        stroke="var(--color-ui-4)"
      />
    </svg>
  );
}
