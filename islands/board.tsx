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
  cols: Signal<number>;
  rows: Signal<number>;
  destination: Signal<Position>;
  pieces: Signal<Piece[]>;
  walls: Signal<Wall[]>;
}

export default function Board(
  { href, cols, rows, destination, pieces, walls }: BoardProps,
) {
  const url = new URL(href.value);
  const [active, setActive] = useState<Position | null>(
    parsePosition(url.searchParams.get("a")),
  );
  const ref = useRef<HTMLDivElement>(null);

  const board = useMemo(() => ({
    cols: cols.value,
    rows: rows.value,
    destination: destination.value,
    pieces: pieces.value,
    walls: walls.value,
  }), [cols.value, rows.value, destination.value, pieces.value, walls.value]);

  const targets = useMemo(
    () => active ? getTargets(active, board) : null,
    [active],
  );

  const spaces = useMemo(() => {
    const positions: Position[][] = [];

    for (let y = 0; y < rows.value; y++) {
      positions[y] = [];

      for (let x = 0; x < cols.value; x++) {
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

  const movePiece = useCallback((src: Position, position: Position) => {
    if (!src) return;

    const updatedPieces = pieces.value.map((piece) =>
      isPositionSame(piece, src)
        ? {
          ...piece,
          ...position,
        }
        : piece
    );

    const url = new URL(href.value);

    const state: BoardState = {
      cols: cols.value,
      rows: rows.value,
      destination: destination.value,
      pieces: updatedPieces,
      walls: walls.value,
    };

    url.search = new URLSearchParams(stringifyBoard(state)).toString();
    self.history.pushState({}, "", url);
    href.value = url.toString();
    self.dispatchEvent(new CustomEvent("board-change"));

    setActive(position);
  }, [active, pieces.value]);

  const onFlick = useCallback(
    (src: Position, direction: "up" | "right" | "down" | "left") => {
      const possibleTargets = getTargets(src, {
        cols: cols.value,
        rows: rows.value,
        pieces: pieces.value,
        walls: walls.value,
      });

      const targetKeyMatcher: Record<
        typeof direction,
        keyof typeof possibleTargets
      > = {
        up: "top",
        right: "right",
        down: "bottom",
        left: "left",
      };
      const targetKey = targetKeyMatcher[direction];
      const possibleTarget = possibleTargets[targetKey];

      if (possibleTarget) {
        setActive(src);
        movePiece(src, possibleTarget);
      }
    },
    [],
  );

  useEffect(() => {
    const onBoardChange = () => {
      const state = parseBoard(self.location.search);

      cols.value = state.cols;
      rows.value = state.rows;
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

      console.log("event.key", event.key);

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
        "--space-w": "clamp(40px, 5vw, 64px)",
        gridTemplateColumns: `repeat(${cols},var(--space-w))`,
        gridTemplateRows: `repeat(${rows},var(--space-w))`,
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

      {pieces.value.map((piece) => (
        <BoardPiece
          href={getPieceHref(piece)}
          {...piece}
          onActivate={setActive}
          onFlick={onFlick}
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
  const top = targets.top ?? active;
  const right = targets.right ?? active;
  const bottom = targets.bottom ?? active;
  const left = targets.left ?? active;

  return (
    <>
      <div
        className="bg-[var(--active-bg)] opacity-5 pointer-events-none"
        style={{
          gridColumnStart: `${top.x + 1}`,
          gridRowStart: `${top.y + 1}`,
          gridRowEnd: `${bottom.y + 2}`,
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
