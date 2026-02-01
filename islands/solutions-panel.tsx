import type { Signal } from "@preact/signals";
import { cn } from "#/lib/style.ts";
import type { Solution } from "#/db/types.ts";
import { useCallback, useMemo } from "preact/hooks";
import { Panel } from "#/components/panel.tsx";

type ControlsPanelProps = {
  href: Signal<string>;
  solutions: Solution[];
  solution: Solution | null;
};

export function SolutionsPanel(
  { href, solutions, solution }: ControlsPanelProps,
) {
  if (!solution) solution = solutions[0];

  const solutionItems = useMemo(() => {
    const isSolutionInList = solutions.some((item) => item.id === solution.id);
    if (!isSolutionInList) return [...solutions.slice(0, 8), null, solution];

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
      <ol
        className={cn(
          "grid col-[2/3] lg:col-auto w-full items-center gap-x-fl-2 gap-y-1",
          "lg:row-[3/4] lg:grid-flow-row lg:grid-rows-[auto] lg:content-start",
        )}
      >
        {solutionItems.map((item) =>
          item === null ? <li className="p-0">...</li> : (
            <li
              key={item?.id}
              className={cn(
                "p-0 px-1 border-b-1 border-gray-5",
                item?.id === solution.id && "text-brand font-5 bg-surface-1",
              )}
            >
              <a
                className="flex gap-2"
                href={getSolutionUrl(item)}
              >
                <span>{item.moves.length}.</span>
                {item.name}
              </a>
            </li>
          )
        )}
      </ol>
    </Panel>
  );
}
