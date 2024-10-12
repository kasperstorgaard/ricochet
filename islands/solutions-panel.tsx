import type { Signal } from "@preact/signals";
import { cn } from "#/lib/style.ts";
import type { Solution } from "#/db/types.ts";
import { useCallback } from "preact/hooks";

type ControlsPanelProps = {
  href: Signal<string>;
  solutions: Solution[];
  solution: Solution | null;
};

export function SolutionsPanel(
  { href, solutions, solution }: ControlsPanelProps,
) {
  if (!solution) solution = solutions[0];

  const isSolutionInList = solutions.some((item) => item.id === solution.id);

  const getSolutionUrl = useCallback((item: Solution) => {
    const url = new URL(href.value);
    url.pathname = `/puzzles/${item.puzzleId}/solutions/${item.id}`;
    url.search = "";
    return url.href;
  }, [href.value]);

  return (
    <aside className="flex col-[2/3] place-items-start gap-fl-1 px-3 text-fl-1 w-full">
      <ol>
        {solutions.map((item) => (
          <li
            key={item.id}
            className={cn(
              "text-yellow-3",
              item.id === solution.id && "text-purple-4",
            )}
          >
            <a href={getSolutionUrl(item)}>
              <span>{item.moves.length}</span>
              {item.name}
            </a>
          </li>
        ))}

        {!isSolutionInList && (
          <>
            <li>
              ...
            </li>
            <li>
              <a href={getSolutionUrl(solution)}>
                <span>{solution.moves.length}</span>
                {solution.name}
              </a>
            </li>
          </>
        )}
      </ol>
    </aside>
  );
}
