import type { Signal } from "@preact/signals";
import { clsx } from "clsx/lite";
import { useCallback, useMemo, useState } from "preact/hooks";

import { Panel } from "#/components/panel.tsx";
import type { Solution } from "#/db/types.ts";
import { Puzzle } from "#/game/types.ts";

type SolutionsPanelProps = {
  href: Signal<string>;
  puzzle: Signal<Puzzle>;
  solutions: Solution[];
  solution: Solution | null;
};

export function SolutionsPanel(
  { href, puzzle, solutions, solution }: SolutionsPanelProps,
) {
  const [copied, setCopied] = useState(false);

  const onShare = useCallback(async () => {
    const url = new URL(href.value);
    url.search = "";
    if (solution) {
      url.pathname = `/puzzles/${solution.puzzleSlug}/solutions/${solution.id}`;
    }
    const shareUrl = url.href;

    if ("share" in navigator) {
      await globalThis.navigator.share({
        title: puzzle.value.name,
        url: shareUrl,
      });
    } else {
      await globalThis.navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [href.value, puzzle.value.name, solution]);

  const solutionItems = useMemo(() => {
    const isSolutionInList = solution &&
      solutions.some((item) => item.id === solution.id);

    if (solution && !isSolutionInList) {
      return [...solutions.slice(0, 8), null, solution];
    }

    return solutions;
  }, [solutions, solution]);

  const getSolutionUrl = useCallback((item: Solution) => {
    const url = new URL(href.value);
    url.pathname = `/puzzles/${item.puzzleSlug}/solutions/${item.id}`;
    url.search = "";
    return url.href;
  }, [href.value]);

  return (
    <Panel>
      <div
        className={clsx(
          "grid col-[2/3] lg:col-auto grid-cols-[minmax(auto,20rem)] w-full place-content-center gap-fl-3 m-0 p-0 list-none",
          "lg:row-[3/4] lg:grid-flow-row lg:grid-rows-[auto] lg:content-between",
        )}
      >
        {solutionItems.length === 0
          ? (
            <p className="text-fl-1 leading-snug text-center">
              No solutions posted yet.
            </p>
          )
          : (
            <ol className="m-0 p-0 list-none grid items-center gap-x-fl-2 gap-y-1">
              {solutionItems.map((item, idx) =>
                item === null
                  ? <li key="delimiter" className="p-0">...</li>
                  : (
                    <li key={item.id} className="group p-0">
                      <a
                        className={clsx(
                          "flex items-center px-fl-1 pr-fl-2 py-1 gap-fl-2",
                          "rounded-2 border-1 border-current text-text-2 no-underline",
                          "hover:bg-link hover:border-link hover:text-blue-0",
                          "data-active:font-bold data-active:border-b-2",
                          "lg:gap-2 lg:pr-fl-1 lg:pl-2 md:text-fl-0",
                        )}
                        data-active={item.id === solution?.id
                          ? true
                          : undefined}
                        href={getSolutionUrl(item)}
                      >
                        <span className="shrink-0 min-w-[2ch] text-right">
                          {item.moves.length}
                        </span>

                        <span className="grow overflow-hidden text-ellipsis whitespace-nowrap">
                          {item.name}
                        </span>

                        {idx === 0 && (
                          <i
                            className={clsx(
                              "ph ph-trophy shrink-0 text-ui-2",
                            )}
                          />
                        )}
                      </a>
                    </li>
                  )
              )}
            </ol>
          )}

        <div className="flex gap-2 items-center justify-center flex-wrap lg:grid lg:grid-cols-1 lg:justify-start">
          {
            /*
            TODO: once per-puzzle completion state is tracked (e.g. via cookie or KV),
            use it here to show "Play again" vs "Try this puzzle" based on whether the
            current user has actually solved this puzzle themselves.
          */
          }
          <a
            href={`/puzzles/${puzzle.value.slug}`}
            className="btn"
          >
            <i className="ph ph-arrow-counter-clockwise" />
            Play again
          </a>

          <button type="button" className="btn" onClick={onShare}>
            <i
              className={clsx(copied ? "ph-check ph" : "ph-share-network ph")}
            />
            {copied ? "Copied!" : "Share"}
          </button>
        </div>
      </div>
    </Panel>
  );
}
