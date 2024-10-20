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
    <aside className="grid col-[2/3] place-items-start gap-fl-1 text-fl-1 w-full">
      <ol className="grid w-full grid-rows-5 grid-cols-2 text-gray-3 grid-flow-col gap-x-2">
        {solutionItems.map((item) =>
          item === null ? <li className="p-0">...</li> : (
            <li
              key={item?.id}
              className={cn(
                "p-0 border-b-1 border-green-2",
                item?.id === solution.id && "text-purple-4",
              )}
            >
              <a
                className="flex gap-2 pt-1"
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
