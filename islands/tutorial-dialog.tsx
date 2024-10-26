import type { Signal } from "@preact/signals";
import { cn } from "#/lib/style.ts";
import { useEffect, useMemo, useRef } from "preact/hooks";
import type { Solution } from "#/db/types.ts";
import { encodeState } from "#/util/url.ts";

type Props = {
  href: Signal<string>;
  mode: Signal<"replay" | "readonly">;
  solution: Solution;
};

export const TutorialDialog = function ({ href, mode, solution }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  const step = useMemo(() => {
    const url = new URL(href.value);
    const rawValue = url.searchParams.get("s");
    const value = rawValue && parseInt(rawValue, 10);

    return !value || isNaN(value) ? 0 : value;
  }, [href.value]);

  const replaySpeed = useMemo(() => {
    const url = new URL(href.value);
    const rawValue = url.searchParams.get("r");
    const value = parseInt(rawValue ?? "", 10);
    return isNaN(value) ? 1 : value;
  }, [href.value]);

  useEffect(() => {
    ref.current?.close();
    ref.current?.showModal();
  }, []);

  useEffect(() => {
    mode.value = step === 2 ? "replay" : "readonly";
  }, [step]);

  return (
    <dialog
      ref={ref}
      open={true}
      className={cn(
        "rounded-1 max-w-lg shadow-4",
        step === 2 &&
          "opacity-0 animate-fade-in",
      )}
      style={{
        animationDelay: `${replaySpeed * 6}s`,
        animationFillMode: "forwards",
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
        <h1 className="text-fl-2 leading-00 text-text-1">
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

      <div className="flex w-full">
        <a
          href={nextStep}
          className="btn ml-auto"
          data-router="push"
        >
          Next
        </a>
      </div>
    </>
  );
}

function TutorialPiecesStep({ href }: TutorialStepProps) {
  const prevStep = useMemo(() => getStepLink(href, 0), [href]);
  const nextStep = useMemo(() => getStepLink(href, 2, { replay: "fast" }), [
    href,
  ]);

  return (
    <>
      <div className="flex flex-col gap-fl-2 text-text-2">
        <h1 className="text-fl-2 leading-1 text-text-1">The pieces</h1>
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

function TutorialSolutionStep({ href, solution }: TutorialStepProps & {
  solution: Solution;
}) {
  const prevStep = useMemo(() => getStepLink(href, 1), [href]);
  const reloadStep = useMemo(
    () => getStepLink(href, 2, { replay: "slow" }),
    [href],
  );
  const nextStep = useMemo(() => {
    const url = new URL(href);
    url.pathname = `/puzzles/${solution.puzzleId}`;
    url.search = encodeState({
      ...solution,
      cursor: 0,
    });
    return url.href;
  }, [href, solution]);

  return (
    <>
      <div className="flex flex-col gap-fl-2 text-text-2">
        <h1 className="text-fl-2 leading-1 text-text-1">Finding a solution</h1>
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
          You can see the number of moves in the bottom control panel, where you
          can also undo/redo moves and reset the puzzle.
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
        >
          Ok, I'm ready!
        </a>
      </div>
    </>
  );
}

type GetStepLinkOptions = {
  replay?: "fast" | "slow";
};

function getStepLink(
  href: string,
  step: number,
  { replay }: GetStepLinkOptions = {},
) {
  const url = new URL(href);
  url.searchParams.set("s", step.toString());

  if (replay) {
    url.searchParams.set("r", replay === "fast" ? "1" : "2");
  }

  return url.href;
}
