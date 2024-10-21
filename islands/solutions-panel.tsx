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
    url.pathname = `/puzzles/${item.puzzleId}/solutions/${item.id}`;
    url.search = "";
    return url.href;
  }, [href.value]);

  return (
    <aside className="col-span-3 grid grid-cols-subgrid min-h-[min(33vh,20rem)] border-t-2 border-teal-3 bg-gray-7 text-fl-0 py-3">
      <ol className="grid col-[2/3] w-full md:grid-rows-5 grid-cols-1 md:grid-cols-2 md:grid-flow-col items-center gap-x-fl-2 text-sand-0">
        {solutionItems.map((item) =>
          item === null ? <li className="p-0">...</li> : (
            <li
              key={item?.id}
              className={cn(
                "p-0 border-b-1 border-gray-5",
                item?.id === solution.id && "text-yellow-3",
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
