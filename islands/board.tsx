import type { Signal } from "@preact/signals";
import { useCallback, useMemo, useState } from "preact/hooks";

import { cn } from "#/lib/style.ts";
import {
  getTargets,
  isPositionSame,
  resolveMoves,
  Targets,
} from "#/util/board.ts";

import { Board as BoardState, Move, Position, Wall } from "#/db/types.ts";

import { Direction, useFlick } from "#/lib/touch.ts";
import { useArrowKeys } from "#/lib/keyboard.ts";
import { useEditor } from "#/util/editor.ts";

type BoardProps = {
  state: Signal<BoardState>;
  isEditorMode?: boolean;
};

/**
 * Ideas:
 * - board state is not all in the url, only pieces
 * - you get the board state from a gameid
 * - the piece moves are stored client side in a session or idb
 * - the moves are validated on the server
 * - add a tutorial, which plays out moves on an interval in front of you interval played out in front of you,
 *   but can be undo/redo'ed to make you understand
 * - add a keyboard navigation hint for desktop
 * - add a touch navigation hint for mobile
 * - ripple fade in of board and pieces, from the outside in, or top to bottom
 * - can't get enough, buy the boardgame (ask for forgiveness, not permission)
 * - extract touch detection to own hook (to make the code cleaner)
 * - undo/redo is just history navigation (is this a good thing even?)
 * - use 2 digit hex to store piece state, eg. 7_0 is 07, 1_2 is 09, 1_5 is 0C etc.
 */
export default function Board(
  { state, isEditorMode }: BoardProps,
) {
  const [active, setActive] = useState<Position | null>(null);
  useEditor({ active, isEnabled: Boolean(isEditorMode), state });

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
    () => active ? getTargets(active, state.value) : null,
    [active],
  );

  const activePiece = useMemo(() => {
    if (!active) return null;

    return state.value.pieces.find((piece) => isPositionSame(piece, active));
  }, [active, state.value]);

  const movePiece = useCallback((move: Move) => {
    if (!move) return;

    state.value = resolveMoves(state.value, [move]);
    setActive(move[1]);
  }, [active, state.value]);

  const onFlick = useCallback(
    (src: Position, direction: "up" | "right" | "down" | "left") => {
      if (!src) return;

      const possibleTargets = getTargets(src, {
        pieces: state.value.pieces,
        walls: state.value.walls,
      });

      const possibleTarget = possibleTargets[direction];

      setActive(src);

      if (possibleTarget) {
        movePiece([src, possibleTarget]);
      }
    },
    [state.value, movePiece],
  );

  const onKeyUp = useCallback(
    (direction: Direction) => active && onFlick(active, direction),
    [active],
  );

  useArrowKeys({ onKeyUp });

  if (!state.value) return null;

  return (
    <div
      className={cn(
        "grid gap-[var(--gap)] w-full",
      )}
      style={{
        "--active-bg": activePiece
          ? activePiece.type === "rook" ? "var(--yellow-3)" : "var(--cyan-7)"
          : null,
        "--gap": "var(--size-1)",
        "--space-w": "clamp(46px - var(--gap), 4vw, 64px)",
        gridTemplateColumns: `repeat(8,var(--space-w))`,
        gridTemplateRows: `repeat(8,var(--space-w))`,
      }}
    >
      {spaces.map((row) =>
        row.map((space) => (
          <BoardSpace
            {...space}
            isActive={Boolean(
              isEditorMode && active && isPositionSame(active, space),
            )}
            onClick={isEditorMode ? () => setActive(space) : undefined}
          />
        ))
      )}

      <BoardDestination {...state.value.destination} />

      {state.value.walls.map((wall) => <BoardWall {...wall} />)}

      {/* If we have an active space/piece, draw the possible destinations  */}
      {active && targets && (
        <>
          {/* Backgrounds between src and destinations */}
          <BoardTargetShaders active={active} targets={targets} />

          {Object.values(targets).map((target) => (
            <BoardTarget
              {...target}
              onClick={() => active && movePiece([active, target])}
            />
          ))}
        </>
      )}

      {state.value.pieces.map((piece) => (
        <BoardPiece
          {...piece}
          onActivate={() => setActive(piece)}
          onFlick={(dir) => onFlick(piece, dir)}
        />
      ))}
    </div>
  );
}

function BoardWall({ x, y, orientation }: Wall) {
  return (
    <div
      className={cn(
        "place-self-start col-[calc(var(--x)+1)] row-[calc(var(--y)+1)] w-full",
        "border-orange-6 aspect-square pointer-events-none",
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
  onClick?: () => void;
};

function BoardSpace({ x, y, isActive, onClick }: BoardSpaceProps) {
  return (
    <button
      className={cn(
        "grid col-[calc(var(--x)+1)] row-[calc(var(--y)+1)] aspect-square rounded-1",
        "border-1 border-stone-9 border-b-1 border-r-1 border-r-stone-7 border-b-stone-7",
        isActive && "border-blue-6",
      )}
      tabIndex={onClick ? 0 : -1}
      style={{
        "--x": x,
        "--y": y,
      }}
      onClick={onClick}
    />
  );
}

function BoardDestination({ x, y }: Position) {
  return (
    <div
      className={cn(
        "col-[calc(var(--x)+1)] w-full row-[calc(var(--y)+1)]",
        "aspect-square place-self-center pointer-events-none",
        "border border-1 border-teal-2",
      )}
      style={{
        "--x": x,
        "--y": y,
      }}
    >
      <svg className="text-teal-2" viewBox="0 0 100 100">
        <line
          x1={0}
          y1={0}
          x2={100}
          y2={100}
          stroke="currentColor"
        />
        <line
          x1={0}
          y1={100}
          x2={100}
          y2={0}
          stroke="currentColor"
        />
      </svg>
    </div>
  );
}

type TargetProps = Position & {
  onClick: () => void;
};

function BoardTarget({ x, y, onClick }: TargetProps) {
  return (
    <button
      className={cn(
        "w-full aspect-square border-1 place-self-center col-[calc(var(--x)+1)] row-[calc(var(--y)+1)]",
        "border-[var(--active-bg)]",
      )}
      style={{
        "--x": x,
        "--y": y,
      }}
      tabIndex={-1}
      onClick={(event) => {
        event.preventDefault();
        onClick();
      }}
    />
  );
}

type BoardTargetShadersProps = {
  active: Position;
  targets: Targets;
};

function BoardTargetShaders({ active, targets }: BoardTargetShadersProps) {
  const up = targets.up ?? active;
  const right = targets.right ?? active;
  const down = targets.down ?? active;
  const left = targets.left ?? active;

  return (
    <>
      <div
        className="bg-[var(--active-bg)] opacity-5 pointer-events-none"
        style={{
          gridColumnStart: `${up.x + 1}`,
          gridRowStart: `${up.y + 1}`,
          gridRowEnd: `${down.y + 2}`,
        }}
      />

      <div
        className="bg-[var(--active-bg)] opacity-5 pointer-events-none"
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
  type: "rook" | "bouncer";
  isActive?: boolean;
  onFlick: (direction: Direction) => void;
  onActivate: () => void;
};

function BoardPiece(
  { isActive, x, y, type, onActivate, onFlick }: BoardPieceProps,
) {
  const { ref } = useFlick<HTMLButtonElement>({ onFlick });

  return (
    <button
      ref={ref}
      className={cn(
        "flex place-content-center col-start-1 row-start-1 p-[var(--pad)]",
        "w-full aspect-square place-self-center ml-[var(--ml)] mt-[var(--mt)]",
        "translate-x-[calc((var(--space-w)+var(--gap))*var(--x))]",
        "translate-y-[calc((var(--space-w)+var(--gap))*var(--y))]",
        "transition-transform duration-200 ease-out",
      )}
      autoFocus={isActive}
      style={{
        "--x": x,
        "--y": y,
        "--ml": x > 0 ? "-1px" : "0px",
        "--mt": x > 0 ? "-1px" : "0px",
        "--pad": "var(--size-2)",
      }}
      onFocus={() => onActivate()}
      onClick={(event) => {
        event.preventDefault();
        onActivate();
      }}
    >
      <div
        className={cn(
          "w-full h-full",
          type === "rook" && "bg-yellow-3 rounded-round",
          type === "bouncer" && "bg-cyan-7 rounded-2",
        )}
      />
    </button>
  );
}
