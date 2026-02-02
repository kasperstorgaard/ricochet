import type { Signal } from "@preact/signals";
import { useEffect, useMemo, useRef } from "preact/hooks";

import type { Solution } from "#/db/types.ts";
import { cn } from "#/lib/style.ts";

type Props = {
  href: Signal<string>;
  mode: Signal<"replay" | "readonly">;
  solution: Omit<Solution, "id" | "name">;
  open?: boolean;
};

export const TutorialDialog = function ({ open, href, mode, solution }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  const step = useMemo(() => {
    const url = new URL(href.value);
    const rawValue = url.searchParams.get("s");
    const value = rawValue && parseInt(rawValue, 10);

    return !value || isNaN(value) ? 0 : value;
  }, [href.value]);

  const replaySpeed = useMemo(() => {
    const url = new URL(href.value);

    const name = url.searchParams.get("r");
    const value = name === "slow" ? 1.5 : 1;

    return isNaN(value) ? 1 : value;
  }, [href.value]);

  useEffect(() => {
    ref.current?.close();

    if (open) ref.current?.showModal();
  }, [open]);

  useEffect(() => {
    mode.value = step === 2 ? "replay" : "readonly";
  }, [step]);

  return (
    <dialog
      ref={ref}
      className={cn(
        "m-auto rounded-1 max-w-lg shadow-4 [animation-fill-mode:forwards]",
        "backdrop:[animation-delay:inherit] backdrop:[animation-fill-mode:forwards]",
        step === 2 &&
          "opacity-0 animate-fade-in backdrop:opacity-0 backdrop:animate-fade-in",
      )}
      style={{
        animationDelay: `${replaySpeed * 5.15}s`,
      }}
    >
      <div className="grid gap-fl-3 p-fl-3">
        {step === 0 && <TutorialWelcomeStep href={href.value} />}
        {step === 1 && <TutorialPiecesStep href={href.value} />}
        {step === 2 && (
          <TutorialSolutionStep href={href.value} solution={solution} />
        )}
      </div>
    </dialog>
  );
};

type TutorialStepProps = {
  href: string;
};

function TutorialWelcomeStep({ href }: TutorialStepProps) {
  const nextStep = useMemo(() => getStepLink(href, 1), [href]);

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
        <button type="submit" className="btn mr-auto">
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
  const nextStep = useMemo(() => getStepLink(href, 2, { replay: "regular" }), [
    href,
  ]);

  return (
    <>
      <div className="flex flex-col gap-fl-2 text-text-2">
        <h1 className="text-fl-2 leading-tight text-text-1">The pieces</h1>
        <p>
          There are two pieces: the "rook" and the "bouncers".
        </p>

        <p>
          Both pieces move like a chess rook, but <strong>only</strong>{" "}
          stop when they hit each other or a wall.
        </p>
        <p>
          When you get the rook to stop on the target, you have found a
          solution.
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
    () => getStepLink(href, 2, { replay: "slow" }),
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
          You can see the number of moves in the control panel, where you can
          also undo/redo moves and reset the puzzle.
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
  replay?: "regular" | "slow";
};

function getStepLink(
  href: string,
  step: number,
  { replay }: GetStepLinkOptions = {},
) {
  const url = new URL(href);
  url.searchParams.set("s", step.toString());

  if (replay) url.searchParams.set("r", replay);

  return url.href;
}
