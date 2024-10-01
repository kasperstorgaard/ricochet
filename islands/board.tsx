import type { Signal } from "@preact/signals";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "preact/hooks";

import { cn } from "../lib/style.ts";
import {
  BoardState,
  getTargets,
  isPositionSame,
  Piece,
  Position,
  Targets,
  Wall,
} from "../util/board.ts";
import { BoardPiece } from "./board-piece.tsx";

import {
  parseBoard,
  parsePosition,
  stringifyBoard,
  stringifyPosition,
} from "../util/url.ts";

interface BoardProps {
  href: Signal<string>;
  destination: Signal<Position>;
  pieces: Signal<Piece[]>;
  walls: Signal<Wall[]>;
}

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
  { href, destination, pieces, walls }: BoardProps,
) {
  const url = new URL(href.value);
  const [active, setActive] = useState<Position | null>(
    parsePosition(url.searchParams.get("a")),
  );
  const ref = useRef<HTMLDivElement>(null);

  const board = useMemo(() => ({
    destination: destination.value,
    pieces: pieces.value,
    walls: walls.value,
  }), [destination.value, pieces.value, walls.value]);

  const targets = useMemo(
    () => active ? getTargets(active, board) : null,
    [active],
  );

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

  const getTargetHref = useCallback((target: Position) => {
    if (!active) return url.href;

    const updatedPieces = board.pieces.map((piece) =>
      isPositionSame(piece, active) ? { ...piece, ...target } : piece
    );

    const updatedUrl = new URL(url);
    updatedUrl.search = stringifyBoard({
      ...board,
      pieces: updatedPieces,
    });
    updatedUrl.searchParams.set("a", stringifyPosition(target));

    return updatedUrl.toString();
  }, [active, url, board]);

  const getPieceHref = useCallback((target: Position) => {
    const updatedUrl = new URL(url);
    updatedUrl.searchParams.set("a", stringifyPosition(target));

    return updatedUrl.toString();
  }, [active, url, board]);

  const activePiece = useMemo(() => {
    if (!active) return null;

    return board.pieces.find((piece) => isPositionSame(piece, active));
  }, [active]);

  const movePiece = useCallback((src: Position, target: Position) => {
    if (!src) return;

    const updatedPieces = board.pieces.map((piece) =>
      isPositionSame(piece, src)
        ? {
          ...piece,
          ...target,
        }
        : piece
    );

    const url = new URL(href.value);

    const state: BoardState = {
      ...board,
      pieces: updatedPieces,
    };

    setActive(target);

    url.search = new URLSearchParams(stringifyBoard(state)).toString();
    self.history.pushState({}, "", url);
    href.value = url.toString();

    self.dispatchEvent(new CustomEvent("board-change"));

    setActive(target);
  }, [active, board]);

  const onFlick = useCallback(
    (src: Position, direction: "up" | "right" | "down" | "left") => {
      if (!src) return;

      const possibleTargets = getTargets(src, {
        pieces: pieces.value,
        walls: walls.value,
      });

      const possibleTarget = possibleTargets[direction];

      setActive(src);

      if (possibleTarget) {
        movePiece(src, possibleTarget);
      }
    },
    [movePiece],
  );

  useEffect(() => {
    const onBoardChange = () => {
      const state = parseBoard(self.location.search);

      destination.value = state.destination;
      pieces.value = state.pieces;
      walls.value = state.walls;
    };

    self.addEventListener("popstate", onBoardChange);
    self.addEventListener("board-change", onBoardChange);

    return () => {
      self.removeEventListener("popstate", onBoardChange);
      self.removeEventListener("board-change", onBoardChange);
    };
  }, []);

  useEffect(() => {
    const onKeyUp = (event: KeyboardEvent) => {
      if (!active) return;

      switch (event.key) {
        case "ArrowUp":
          return onFlick(active, "up");
        case "ArrowRight":
          return onFlick(active, "right");
        case "ArrowDown":
          return onFlick(active, "down");
        case "ArrowLeft":
          return onFlick(active, "left");
      }
    };

    self.addEventListener("keyup", onKeyUp);

    return () => {
      self.removeEventListener("keyup", onKeyUp);
    };
  }, [active]);

  return (
    <div
      ref={ref}
      className={cn(
        "grid gap-[var(--gap)] w-full border-t-1 border-l-1 border-gray-7 rounded-2",
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
      {spaces.map((row) => row.map((space) => <BoardSpace {...space} />))}

      {walls.value.map((wall) => <BoardWall {...wall} />)}

      <BoardDestination {...destination.value} />

      {/* If we have an active space/piece, draw the possible destinations  */}
      {active && targets && (
        <>
          {/* Backgrounds between src and destinations */}
          <BoardTargetShaders active={active} targets={targets} />

          {Object.values(targets).map((target) => (
            <BoardTarget
              {...target}
              href={getTargetHref(target)}
              onClick={() => {
                if (!active) return;

                movePiece(active, target);
              }}
            />
          ))}
        </>
      )}

      {pieces.value.map((piece, idx) => (
        <BoardPiece
          key={piece.type + idx}
          href={getPieceHref(piece)}
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
    <span
      className={cn(
        "place-self-start border-orange-5",
        orientation === "vertical"
          ? "h-full border-r-2 -ml-[5px]"
          : "w-full border-t-2 -mt-[5px]",
      )}
      style={{
        gridColumnStart: `${x + 1}`,
        gridRowStart: `${y + 1}`,
      }}
    />
  );
}

function BoardSpace({ x, y }: Position) {
  return (
    <div
      className={cn(
        "grid border-1 border-gray-9 border-b-1 border-r-1 border-r-gray-6 border-b-gray-6 aspect-square rounded-1",
      )}
      style={{
        gridColumn: `${x + 1}`,
        gridRow: `${y + 1}`,
      }}
    />
  );
}

function BoardDestination({ x, y }: Position) {
  return (
    <div
      className={cn(
        "col-start-[var(--destination-x)] w-full row-start-[var(--destination-y)]",
        "aspect-square place-self-center",
        "border border-1 border-teal-2",
      )}
      style={{
        "--destination-x": x,
        "--destination-y": y,
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
  href: string;
  onClick: () => void;
};

function BoardTarget({ href, x, y, onClick }: TargetProps) {
  return (
    <a
      href={href}
      className="w-full aspect-square border-1 place-self-center border-[var(--active-bg)]"
      style={{
        gridColumnStart: `${x + 1}`,
        gridRowStart: `${y + 1}`,
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
