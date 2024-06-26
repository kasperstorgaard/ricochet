export type Position = {
  x: number;
  y: number;
};

export type Wall = Position & {
  orientation: "horizontal" | "vertical";
};

export function isPositionAligned(src: Position, target: Position) {
  return src.x === target.x || src.y === target.y;
}

export function isPositionSame(src: Position, target: Position) {
  return src.x === target.x && src.y === target.y;
}

type AllowedTargetOptions = {
  walls: Wall[];
  rows: number;
  cols: number;
};

export function getDestinations(
  src: Position,
  { walls, rows, cols }: AllowedTargetOptions,
) {
  const top = { x: src.x, y: 0 };
  const right = { x: cols - 1, y: src.y };
  const bottom = { x: src.x, y: rows - 1 };
  const left = { x: 0, y: src.y };

  for (const wall of walls) {
    if (wall.y === src.y && wall.orientation === "vertical") {
      if (wall.x <= src.x && wall.x > left.x) {
        left.x = wall.x;
      }

      if (wall.x > src.x && wall.x <= right.x) {
        right.x = wall.x - 1;
      }
    } else if (wall.x === src.x && wall.orientation === "horizontal") {
      if (wall.y <= src.y && wall.y > top.y) {
        top.y = wall.y;
      }

      if (wall.y > src.y && wall.y <= bottom.y) {
        bottom.y = wall.y - 1;
      }
    }
  }

  return { top, right, bottom, left };
}
