import type { Signal } from "@preact/signals";
import { useCallback, useEffect, useMemo, useRef } from "preact/hooks";

import { SolutionDialog } from "#/islands/solution-dialog.tsx";
import { useKeyboard } from "#/lib/keyboard.ts";
import { useRouter } from "#/lib/router.ts";
import { cn } from "#/lib/style.ts";
import { Direction, useFlick } from "#/lib/touch.ts";
import {
  getMoveDirection,
  getTargets,
  isPositionSame,
  isValidSolution,
  resolveMoves,
  Targets,
} from "#/util/board.ts";
import { useEditor } from "#/util/editor.ts";
import { type Move, type Piece, Position, Puzzle, Wall } from "#/util/types.ts";
import { decodeState, getActiveHref, getMovesHref } from "#/util/url.ts";

type BoardProps = {
  href: Signal<string>;
  puzzle: Signal<Puzzle>;
  mode: Signal<"editor" | "replay" | "solve" | "readonly">;
};

/**
 * TODO:
 * - split more components out (BoardPiece etc.)
 * - create more atomic helpers
 */
export default function Board(
  { href, puzzle, mode }: BoardProps,
) {
  const solutionDialogRef = useRef<HTMLDialogElement>(null);

  const state = useMemo(() => decodeState(href.value), [href.value]);
  const moves = useMemo(
    () => state.moves.slice(0, state.cursor ?? state.moves.length),
    [
      state.moves,
      state.cursor,
    ],
  );

  const board = useMemo(() => resolveMoves(puzzle.value.board, moves), [
    puzzle.value.board,
    state.moves,
  ]);
  const hasSolution = useMemo(
    () => isValidSolution(board),
    [puzzle.value.board, moves],
  );

  const onLocationUpdated = useCallback((url: URL) => {
    href.value = url.href;
  }, [board]);

  useEffect(() => {
    solutionDialogRef.current?.close();

    if (mode.value === "solve" && hasSolution) {
      /**
       * Need to close and re-open the modal, since `open` prop gives the behavior
       * of a non-modal dialog.
       */
      solutionDialogRef.current?.showModal();
    }
  }, [mode, hasSolution]);

  const { updateLocation } = useRouter({
    onLocationUpdated,
  });

  const spaces = useMemo(() => {
    const positions: Position[][] = [];

    for (let y = 0; y < 8; y++) {
      positions[y] = [];

      for (let x = 0; x < 8; x++) {
        positions[y].push({ x, y });
      }
    }

    return positions;
  }, []);

  const targets = useMemo(
    () =>
      state.active && mode.value === "solve"
        ? getTargets(state.active, board)
        : null,
    [state.active, board, mode.value],
  );

  const hint = useMemo(
    () => {
      if (!state.hint || mode.value !== "solve") return null;

      // convert hint move to targets
      const direction = getMoveDirection(state.hint);
      const hintTargets: Targets = {};
      hintTargets[direction] = state.hint[1];

      return hintTargets;
    },
    [state.hint, mode.value],
  );

  const activePiece = useMemo(() => {
    if (!state.active) return null;

    return board.pieces.find((piece) => isPositionSame(piece, state.active!));
  }, [state.active, puzzle.value.board.pieces]);

  const replaySpeed = useMemo(() => {
    const url = new URL(href.value);

    const rawValue = url.searchParams.get("replay_speed");
    const value = parseFloat(rawValue ?? "");

    return isNaN(value) ? 1 : value;
  }, [href.value]);

  const onFlick = useCallback(
    (src: Position, direction: "up" | "right" | "down" | "left") => {
      if (!src) return;

      const possibleTargets = getTargets(src, {
        pieces: board.pieces,
        walls: board.walls,
      });

      const possibleTarget = possibleTargets[direction];
      let updatedHref = getActiveHref(src, { ...state, href: href.value });

      if (possibleTarget) {
        updatedHref = getMovesHref([[src, possibleTarget]], {
          ...state,
          href: updatedHref,
        });
      }

      updateLocation(updatedHref);
    },
    [state, href.value],
  );

  const onHint = useCallback(() => {
    const url = new URL(globalThis.location.href);
    url.pathname = `puzzles/${puzzle.value.slug}/hint`;

    globalThis.location.href = url.href;
  }, [state.moves, puzzle.value.slug]);

  const onArrowKey = useCallback(
    (direction: Direction) => state.active && onFlick(state.active, direction),
    [state.active, onFlick],
  );

  const onCommand = useCallback(
    (type: "hint") => {
      switch (type) {
        case "hint":
          return onHint();
      }
    },
    [href.value, onHint],
  );

  useEditor({
    active: state.active,
    isEnabled: mode.value === "editor",
    puzzle,
  });

  useKeyboard({ onArrowKey, onCommand, isEnabled: mode.value === "solve" });

  if (!state) return null;

  return (
    <>
      <div
        style={{
          "--active-bg": activePiece
            ? activePiece.type === "rook"
              ? "var(--color-ui-2)"
              : "var(--color-ui-3)"
            : null,
          "--hint-bg": "var(--color-ui-contrast)",
          "--replay-len": moves.length,
          "--gap": "var(--size-1)",
          "--space-w": "clamp(44px - var(--gap), 5vw, 56px)",
          "--replay-speed": `${1 / replaySpeed}s`,
        }}
        className={cn(
          "grid gap-(--gap) w-full grid-cols-[repeat(8,var(--space-w))] grid-rows-[repeat(8,var(--space-w))]",
        )}
      >
        {spaces.map((row) =>
          row.map((space) => (
            <BoardSpace
              {...space}
              isActive={Boolean(
                mode.value === "editor" && state.active &&
                  isPositionSame(state.active, space),
              )}
              href={mode.value === "editor"
                ? getActiveHref(space, { ...state, href: href.value })
                : undefined}
              data-router="replace"
            />
          ))
        )}

        <BoardDestination {...board.destination} />

        {board.walls.map((wall) => (
          <BoardWall
            key={`${wall.x}-${wall.y}-${wall.orientation}`}
            {...wall}
          />
        ))}

        {/* If we have an active space/piece, draw the possible destinations  */}
        {state.active && targets && (
          <>
            {/* Backgrounds between src and destinations */}
            <MovesGuide
              active={state.active}
              targets={targets}
            />

            {Object.values(targets).map((target) => (
              <BoardTarget
                {...target}
                href={getMovesHref([[state.active!, target]], {
                  ...state,
                  href: href.value,
                })}
              />
            ))}
          </>
        )}

        {/* If we have a hint, draw the destination */}
        {state.hint && hint && (
          <>
            {/* Backgrounds between src and destinations */}
            <MovesGuide
              active={state.hint[0]}
              targets={hint}
              isHint
            />

            <BoardTarget
              {...state.hint[1]}
              href={getMovesHref([state.hint], {
                ...state,
                href: href.value,
              })}
              isHint
            />
          </>
        )}

        {board.pieces.map((piece, idx) => (
          <BoardPiece
            {...piece}
            href={getActiveHref(piece, { ...state, href: href.value })}
            id={getPieceId(piece, idx)}
            isActive={state.active && isPositionSame(piece, state.active)}
            isReadonly={mode.value === "replay" || mode.value === "editor"}
            onFocus={(event) => {
              const href = (event.target as HTMLAnchorElement).href;
              updateLocation(href, { replace: true });
            }}
            onFlick={(dir) => onFlick(piece, dir)}
          />
        ))}

        {mode.value === "replay" && (
          <BoardReplayStyles
            puzzle={puzzle.value}
            moves={moves}
          />
        )}
      </div>

      <SolutionDialog
        open={mode.value === "solve" &&
          !solutionDialogRef.current &&
          hasSolution}
        href={href}
        puzzle={puzzle}
      />
    </>
  );
}

function BoardWall({ x, y, orientation }: Wall) {
  return (
    <div
      className={cn(
        "place-self-start col-[calc(var(--x)+1)] row-[calc(var(--y)+1)] w-full",
        "border-ui-4 aspect-square pointer-events-none",
        orientation === "vertical" ? "border-l-2" : "border-t-2",
      )}
      style={{
        "--x": x,
        "--y": y,
      }}
    />
  );
}

type BoardSpaceProps = Position & {
  isActive?: boolean;
  href?: string;
};

function BoardSpace({ x, y, href, isActive }: BoardSpaceProps) {
  if (href) {
    return (
      <a
        href={href}
        className={cn(
          "grid col-[calc(var(--x)+1)] row-[calc(var(--y)+1)] aspect-square rounded-1",
          "border-1 border-stone-9 border-b-1 border-r-1 border-r-stone-7 border-b-stone-7",
          isActive && "border-blue-6",
        )}
        style={{
          "--x": x,
          "--y": y,
        }}
        data-router="replace"
      />
    );
  }

  return (
    <div
      className={cn(
        "grid col-[calc(var(--x)+1)] row-[calc(var(--y)+1)] aspect-square rounded-1",
        "border-1 border-stone-9 border-b-1 border-r-1 border-r-stone-7 border-b-stone-7",
      )}
      style={{
        "--x": x,
        "--y": y,
      }}
    />
  );
}

function BoardDestination({ x, y }: Position & { isHint?: boolean }) {
  return (
    <div
      className={cn(
        "col-[calc(var(--x)+1)] w-full row-[calc(var(--y)+1)]",
        "aspect-square place-self-center pointer-events-none",
        "border-2 border-ui-1",
      )}
      style={{
        "--x": x,
        "--y": y,
      }}
    >
      <svg
        className={cn("text-ui-1")}
        viewBox="0 0 100 100"
      >
        <line
          x1={0}
          y1={0}
          x2={100}
          y2={100}
          strokeWidth={3}
          stroke="currentColor"
        />
        <line
          x1={0}
          y1={100}
          x2={100}
          y2={0}
          strokeWidth={3}
          stroke="currentColor"
        />
      </svg>
    </div>
  );
}

type TargetProps = Position & {
  href: string;
  isHint?: boolean;
};

function BoardTarget({ x, y, href, isHint }: TargetProps) {
  return (
    <a
      href={href}
      className={cn(
        "w-full aspect-square border-1 place-self-center col-[calc(var(--x)+1)] row-[calc(var(--y)+1)]",
        "border-(--active-bg)",
        isHint && "border-(--hint-bg) animate-blink",
      )}
      style={{
        "--x": x,
        "--y": y,
      }}
      tabIndex={-1}
      data-router="push"
    />
  );
}

type MovesGuideProps = {
  active: Position;
  targets: Targets;
  isHint?: boolean;
};

function MovesGuide(
  { active, targets, isHint }: MovesGuideProps,
) {
  const up = targets.up ?? active;
  const right = targets.right ?? active;
  const down = targets.down ?? active;
  const left = targets.left ?? active;

  return (
    <>
      <div
        className={cn(
          "bg-(--active-bg) opacity-20 pointer-events-none",
          isHint && "bg-(--hint-bg)/50 animate-blink",
        )}
        style={{
          gridColumnStart: `${up.x + 1}`,
          gridRowStart: `${up.y + 1}`,
          gridRowEnd: `${down.y + 2}`,
        }}
      />

      <div
        className={cn(
          "bg-(--active-bg) opacity-20 pointer-events-none",
          isHint && "bg-(--hint-bg)/50 animate-blink",
        )}
        style={{
          gridColumnStart: `${left.x + 1}`,
          gridColumnEnd: `${right.x + 2}`,
          gridRowStart: `${left.y + 1}`,
        }}
      />
    </>
  );
}

type BoardPieceProps = {
  x: number;
  y: number;
  id: string;
  href: string;
  type: "rook" | "bouncer";
  isActive?: boolean;
  isReadonly?: boolean;
  onFlick: (direction: Direction) => void;
  onFocus: (event: FocusEvent) => void;
};

function BoardPiece(
  { x, y, id, href, type, isReadonly, onFlick, onFocus }: BoardPieceProps,
) {
  const { ref } = useFlick<HTMLAnchorElement>({
    onFlick,
    isEnabled: !isReadonly,
  });

  return (
    <a
      ref={ref}
      id={id}
      href={isReadonly ? "#" : href}
      className={cn(
        "flex place-content-center col-start-1 row-start-1 p-(--pad)",
        "w-full aspect-square place-self-center ml-(--ml) mt-(--mt)",
        "translate-x-[calc((var(--space-w)+var(--gap))*var(--x))]",
        "translate-y-[calc((var(--space-w)+var(--gap))*var(--y))]",
        "transition-transform duration-200 ease-out",
        "[--replay-duration:calc(var(--replay-len)*var(--replay-speed))]",
        isReadonly && "pointer-events-none",
      )}
      style={{
        animation: `replay-${id} var(--replay-duration) ease-in-out`,
        "--x": x,
        "--y": y,
        "--ml": x > 0 ? "-1px" : "0px",
        "--mt": x > 0 ? "-1px" : "0px",
        "--pad": "var(--size-2)",
      }}
      tabIndex={isReadonly ? -1 : 0}
      onFocus={onFocus}
      data-router={isReadonly ? undefined : "replace"}
    >
      <div
        className={cn(
          "w-full h-full",
          type === "rook" && "bg-ui-2 rounded-round",
          type === "bouncer" && "bg-ui-3 rounded-1",
        )}
      />
    </a>
  );
}

type BoardReplayProps = {
  puzzle: Puzzle;
  moves: Move[];
};

function BoardReplayStyles({ puzzle, moves }: BoardReplayProps) {
  if (!moves.length) return null;

  /**
   * Build up a lookup of which pieces to move at which index.
   * This is because we have to look at the moves as a whole, to determine which piece was moved.
   */
  const pieceMovesLookup: Record<string, { idx: number; move: Move }[]> = {};
  const totalMoves = moves.length;
  const increment = 100 / totalMoves;

  for (let idx = 0; idx < moves.length; idx++) {
    const move = moves[idx];

    const state = resolveMoves(puzzle.board, moves.slice(0, idx));
    const piece = state.pieces.find((item) => isPositionSame(item, move[0]));
    if (!piece) continue;

    const id = getPieceId(piece, state.pieces.indexOf(piece));

    if (!pieceMovesLookup[id]) pieceMovesLookup[id] = [{ idx, move }];
    else pieceMovesLookup[id].push({ idx, move });
  }

  return (
    <style>
      {Object.entries(pieceMovesLookup).map(([id, pieceMoves]) => {
        return [
          `@keyframes replay-${id} {`,
          `  ${writeKeyframeMove(0, pieceMoves[0].move[0])}`,
          ...pieceMoves.flatMap(({ idx, move }) => /*
                * Set a start position just before animating,
                to make sure the animation happens in single steps, not all the way from the start,
                then animate to position.
                */
          [
            `  ${writeKeyframeMove(idx * increment, move[0])}`,
            `  ${writeKeyframeMove((idx + 1) * increment, move[1])}`,
          ]),
          "}",
        ].join("");
      })}
    </style>
  );
}

function writeKeyframeMove(percentage: number, position: Position) {
  return `${percentage}% { --x: ${position.x}; --y: ${position.y}; }`;
}

export function getPieceId(piece: Piece, idx: number) {
  return `${piece.type === "rook" ? "r" : "b"}_${idx}`;
}
