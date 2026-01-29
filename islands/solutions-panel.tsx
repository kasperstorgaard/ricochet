import type { Signal } from "@preact/signals";
import { cn } from "#/lib/style.ts";
import type { Solution } from "#/db/types.ts";
import { useCallback, useMemo } from "preact/hooks";

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
    <aside
      className={cn(
        "col-span-3 grid grid-cols-subgrid place-content-start max-md:min-h-[min(25vh,20rem)] border-t-2 border-brand bg-surface-2 text-fl-1 py-fl-3",
        "lg:fixed lg:top-0 lg:right-0 lg:h-full lg:px-fl-2 lg:grid-cols-1",
      )}
    >
      <ol className="grid col-[2/3] w-full md:grid-rows-5 md:grid-cols-2 lg:grid-cols-1 md:grid-flow-col lg:grid-flow-row items-center gap-x-fl-2 gap-y-1">
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
    </aside>
  );
}
