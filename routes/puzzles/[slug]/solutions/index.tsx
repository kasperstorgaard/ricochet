import { useSignal } from "@preact/signals";
import { clsx } from "clsx/lite";
import { HttpError, page } from "fresh";

import { Header } from "#/components/header.tsx";
import { Main } from "#/components/main.tsx";
import { Panel } from "#/components/panel.tsx";
import { define } from "#/core.ts";
import {
  getCanonicalGroup,
  listCanonicalGroups,
  listUserPuzzleSolutions,
} from "#/db/solutions.ts";
import { CanonicalGroup } from "#/db/types.ts";
import { getPuzzle } from "#/game/loader.ts";
import { getCanonicalMoveKey } from "#/game/strings.ts";
import { Puzzle } from "#/game/types.ts";
import { DifficultyBadge } from "#/islands/difficulty-badge.tsx";

type Data = {
  puzzle: Puzzle;
  groups: CanonicalGroup[];
  extraGroups: CanonicalGroup[];
  userCanonicalKeys: string[];
  userId: string;
};

export const handler = define.handlers<Data>({
  async GET(ctx) {
    const { slug } = ctx.params;
    const userId = ctx.state.userId;

    const puzzle = await getPuzzle(ctx.url.origin, slug);
    if (!puzzle) {
      throw new HttpError(404, `Unable to find a puzzle with slug: ${slug}`);
    }

    const groups = await listCanonicalGroups(slug, { limit: 6 });
    const groupKeySet = new Set(groups.map((g) => g.canonicalKey));

    const userCanonicalKeys: string[] = [];
    const extraGroups: CanonicalGroup[] = [];

    if (userId) {
      const userSolutions = await listUserPuzzleSolutions(userId, slug, {
        limit: 100,
      });

      for (const sol of userSolutions) {
        const ck = getCanonicalMoveKey(sol.moves);
        if (!userCanonicalKeys.includes(ck)) {
          userCanonicalKeys.push(ck);
        }
        if (
          !groupKeySet.has(ck) &&
          !extraGroups.some((g) => g.canonicalKey === ck)
        ) {
          const extra = await getCanonicalGroup(slug, sol.moves.length, ck);
          if (extra) extraGroups.push(extra);
        }
      }
    }

    return page({ puzzle, groups, extraGroups, userCanonicalKeys, userId });
  },
});

export default define.page<typeof handler>(function SolutionsListPage(props) {
  const puzzle = useSignal(props.data.puzzle);
  const showMinMoves = props.state.featureFlags.minMoves ?? false;
  const url = new URL(props.req.url);
  const { groups, extraGroups, userCanonicalKeys } = props.data;
  const minMoves = props.data.puzzle.minMoves;
  const solutionsHref = `/puzzles/${props.data.puzzle.slug}/solutions`;

  const visibleGroups: (CanonicalGroup | null)[] = extraGroups.length > 0
    ? [...groups, null, ...extraGroups]
    : groups;

  return (
    <>
      <Main className="justify-stretch">
        <Header
          url={url}
          back={{ href: `/puzzles/${props.data.puzzle.slug}` }}
          themePicker
        />

        <div className="flex items-center justify-between mt-2 flex-wrap gap-fl-1">
          <div className="flex flex-col">
            <h1 className="text-5 text-brand leading-tight">
              {props.data.puzzle.name}
            </h1>
            <p className="text-fl-0 text-text-3 leading-tight italic -mb-[.6lh] -mt-[.4lh]">
              solutions
            </p>
          </div>

          <DifficultyBadge puzzle={puzzle} showMinMoves={showMinMoves} />
        </div>

        <div>
          {/* TODO: move distribution histogram */}

          {visibleGroups.length === 0
            ? <p className="text-text-3">No solutions posted yet.</p>
            : (
              <ol className="m-0 p-0 list-none flex flex-col gap-y-1 w-full">
                {visibleGroups.map((group) => {
                  if (group === null) {
                    return (
                      <li
                        key="delimiter"
                        className="p-0 text-text-3 text-fl-0 px-fl-1 pr-fl-2"
                      >
                        …
                      </li>
                    );
                  }

                  const isFound = userCanonicalKeys.includes(
                    group.canonicalKey,
                  );
                  const isOptimal = minMoves != null &&
                    group.firstSolution.moves.length === minMoves;
                  const others = group.count - 1;

                  const metaLine = isFound && others > 0
                    ? `you and ${others} other${
                      others === 1 ? "" : "s"
                    } found this solution`
                    : !isFound && others > 0
                    ? `${others} other${
                      others === 1 ? "" : "s"
                    } found this solution`
                    : "unique solution";

                  return (
                    <li key={group.canonicalKey} className="p-0">
                      <a
                        href={`${solutionsHref}/${group.firstSolution.id}`}
                        className={clsx(
                          "group grid grid-cols-[3rem_1fr_auto] items-center gap-x-fl-1",
                          "px-fl-1 pr-fl-2 py-2 rounded-2 no-underline",
                          "bg-surface-3/20 border-text-3/20 border-l-3 border-l-text-3",
                          "hover:bg-surface-3",
                          "data-found:border-l-brand",
                        )}
                        data-found={isFound ? true : undefined}
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-fl-1 font-bold tabular-nums leading-none text-text-1">
                            {group.firstSolution.moves.length}
                          </span>
                          <span className="text-xs text-text-3 mt-0.5">
                            moves
                          </span>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-fl-1 flex-wrap">
                            <span className="text-fl-0 text-text-2 overflow-hidden text-ellipsis whitespace-nowrap">
                              {group.firstSolution.name}
                            </span>
                            <div className="flex gap-2">
                              {isFound && (
                                <span className="text-xs px-1.5 py-px rounded-1 bg-brand/10 border border-brand/20 text-brand whitespace-nowrap">
                                  <i className="ph ph-check" /> found
                                </span>
                              )}
                              {isOptimal && (
                                <span className="text-xs px-1.5 py-px rounded-1 bg-ui-2/10 border border-ui-2/20 text-ui-2 whitespace-nowrap">
                                  <i className="ph ph-star" /> optimal
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-text-3 mt-0.5">
                            {metaLine}
                          </p>
                        </div>

                        <span className="text-fl-0 text-text-link whitespace-nowrap hover:text-link">
                          <i className="ph ph-play" /> Replay
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ol>
            )}
        </div>
      </Main>

      <Panel>
        <div
          className={clsx(
            "max-lg:col-[2/3] flex flex-col gap-fl-2 items-start place-content-end w-full",
            "lg:row-[3/4] lg:gap-fl-3",
          )}
        >
          <a
            href={`/puzzles/${props.data.puzzle.slug}`}
            className="btn"
          >
            <i className="ph ph-arrow-counter-clockwise" />
            Play again
          </a>
        </div>
      </Panel>
    </>
  );
});
