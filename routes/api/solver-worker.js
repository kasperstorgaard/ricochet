// game/board.ts
var COLS = 8;
var ROWS = 8;

// lib/compact-set.ts
var CompactSet = class {
  data;
  mask;
  size = 0;
  constructor(initialCapacity = 1024) {
    let cap = 1;
    while (cap < initialCapacity) cap <<= 1;
    this.data = new Float64Array(cap).fill(-1);
    this.mask = cap - 1;
  }
  has(key) {
    let i = this.hash(key);
    while (this.data[i] !== -1) {
      if (this.data[i] === key) return true;
      i = i + 1 & this.mask;
    }
    return false;
  }
  add(key) {
    if (this.size > this.mask >> 1) this.grow();
    let i = this.hash(key);
    while (this.data[i] !== -1) {
      if (this.data[i] === key) return;
      i = i + 1 & this.mask;
    }
    this.data[i] = key;
    this.size++;
  }
  hash(key) {
    const lo = key >>> 0;
    const hi = key / 4294967296 | 0;
    return Math.imul(lo ^ hi, 2654435769) >>> 0 & this.mask;
  }
  grow() {
    const old = this.data;
    const newCap = this.mask + 1 << 1;
    this.data = new Float64Array(newCap).fill(-1);
    this.mask = newCap - 1;
    this.size = 0;
    for (let i = 0; i < old.length; i++) {
      if (old[i] !== -1) this.add(old[i]);
    }
  }
};

// game/solver.ts
var DEFAULT_MAX_DEPTH = 15;
var BFS_STATE_LIMIT = 1e7;
var SolverDepthExceededError = class extends Error {
  constructor(depth) {
    super(`Solver depth ${depth} exceeded`);
    this.name = "SolverDepthExceededError";
  }
};
function* solve(puzzleOrBoard, options = {}) {
  const board = "board" in puzzleOrBoard ? puzzleOrBoard.board : puzzleOrBoard;
  const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
  const solver = bfsSolve(board, maxDepth);
  let result = solver.next();
  while (!result.done) {
    yield {
      type: "progress",
      depth: result.value
    };
    result = solver.next();
  }
  yield {
    type: "solution",
    moves: result.value
  };
}
function* bfsSolve(board, maxDepth) {
  const destPos = board.destination.y * COLS + board.destination.x;
  const initialState = initState(board);
  if (initialState[0] === destPos) return [];
  const config = {
    ...buildWallLookup(board.walls),
    pieceCount: initialState.length
  };
  const statePool = new Uint8Array(BFS_STATE_LIMIT * config.pieceCount);
  statePool.set(initialState, 0);
  const metadata = {
    parentIndexes: new Int32Array(BFS_STATE_LIMIT).fill(-1),
    fromPositions: new Uint8Array(BFS_STATE_LIMIT),
    toPositions: new Uint8Array(BFS_STATE_LIMIT),
    depths: new Uint8Array(BFS_STATE_LIMIT)
  };
  const buffer = new Uint8Array(config.pieceCount * 8);
  const visited = new CompactSet();
  const stateKey = stateKeyAt(statePool, config, 0);
  visited.add(stateKey);
  let tail = 1;
  let head = 0;
  let lastDepth = 0;
  let hitMaxDepth = false;
  while (head < tail) {
    if (tail >= BFS_STATE_LIMIT) {
      throw new SolverDepthExceededError(maxDepth);
    }
    const headOffset = head * config.pieceCount;
    const depth = metadata.depths[head];
    const parentIdx = head;
    head++;
    if (depth > lastDepth) {
      lastDepth = depth;
      yield depth;
    }
    if (depth >= maxDepth) {
      hitMaxDepth = true;
      continue;
    }
    const moveCount = getMoves(statePool, config, headOffset, buffer);
    for (let idx = 0; idx < moveCount; idx += 2) {
      const fromPos = buffer[idx];
      const toPos = buffer[idx + 1];
      const tailOffset = tail * config.pieceCount;
      applyMove(statePool, config, headOffset, tailOffset, fromPos, toPos);
      const stateKey2 = stateKeyAt(statePool, config, tailOffset);
      if (visited.has(stateKey2)) continue;
      visited.add(stateKey2);
      metadata.parentIndexes[tail] = parentIdx;
      metadata.fromPositions[tail] = fromPos;
      metadata.toPositions[tail] = toPos;
      metadata.depths[tail] = depth + 1;
      if (statePool[tailOffset] === destPos) {
        return reconstructPath(metadata, tail);
      }
      tail++;
    }
  }
  if (hitMaxDepth) throw new SolverDepthExceededError(maxDepth);
  throw new Error("Unsolvable puzzle");
}
function applyMove(pool, config, srcOffset, dstOffset, fromPos, toPos) {
  pool.copyWithin(dstOffset, srcOffset, srcOffset + config.pieceCount);
  if (pool[dstOffset] === fromPos) {
    pool[dstOffset] = toPos;
    return;
  }
  let i = 1;
  while (i < config.pieceCount) {
    if (pool[dstOffset + i] === fromPos) break;
    i++;
  }
  pool[dstOffset + i] = toPos;
  while (i > 1 && pool[dstOffset + i] < pool[dstOffset + i - 1]) {
    const tmp = pool[dstOffset + i];
    pool[dstOffset + i] = pool[dstOffset + i - 1];
    pool[dstOffset + i - 1] = tmp;
    i--;
  }
  while (i < config.pieceCount - 1 && pool[dstOffset + i] > pool[dstOffset + i + 1]) {
    const tmp = pool[dstOffset + i];
    pool[dstOffset + i] = pool[dstOffset + i + 1];
    pool[dstOffset + i + 1] = tmp;
    i++;
  }
}
function getMoves(pool, config, offset, buffer) {
  let count = 0;
  for (let piece = 0; piece < config.pieceCount; piece++) {
    const piecePos = pool[offset + piece];
    const pieceX = piecePos % COLS;
    const pieceY = piecePos / COLS | 0;
    let up = 0, down = ROWS - 1, left = 0, right = COLS - 1;
    for (const wallY of config.hWalls[pieceX]) {
      if (wallY <= pieceY && wallY > up) up = wallY;
      if (wallY > pieceY && wallY - 1 < down) down = wallY - 1;
    }
    for (const wallX of config.vWalls[pieceY]) {
      if (wallX <= pieceX && wallX > left) left = wallX;
      if (wallX > pieceX && wallX - 1 < right) right = wallX - 1;
    }
    for (let otherPiece = 0; otherPiece < config.pieceCount; otherPiece++) {
      if (otherPiece === piece) continue;
      const otherPos = pool[offset + otherPiece];
      const otherX = otherPos % COLS;
      const otherY = otherPos / COLS | 0;
      if (otherY === pieceY) {
        if (otherX < pieceX && otherX >= left) left = otherX + 1;
        if (otherX > pieceX && otherX <= right) right = otherX - 1;
      } else if (otherX === pieceX) {
        if (otherY < pieceY && otherY >= up) up = otherY + 1;
        if (otherY > pieceY && otherY <= down) down = otherY - 1;
      }
    }
    if (up !== pieceY) {
      buffer[count++] = piecePos;
      buffer[count++] = up * COLS + pieceX;
    }
    if (down !== pieceY) {
      buffer[count++] = piecePos;
      buffer[count++] = down * COLS + pieceX;
    }
    if (left !== pieceX) {
      buffer[count++] = piecePos;
      buffer[count++] = pieceY * COLS + left;
    }
    if (right !== pieceX) {
      buffer[count++] = piecePos;
      buffer[count++] = pieceY * COLS + right;
    }
  }
  return count;
}
function buildWallLookup(walls) {
  const hWalls = Array.from({
    length: COLS
  }, () => []);
  const vWalls = Array.from({
    length: ROWS
  }, () => []);
  for (const wall of walls) {
    if (wall.orientation === "horizontal") hWalls[wall.x].push(wall.y);
    else vWalls[wall.y].push(wall.x);
  }
  return {
    hWalls,
    vWalls
  };
}
function initState(board) {
  const puck = board.pieces.find((p) => p.type === "puck");
  const blockers = board.pieces.filter((piece) => piece.type === "blocker").map((piece) => piece.y * COLS + piece.x).sort((a, b) => a - b);
  return new Uint8Array([
    puck.y * COLS + puck.x,
    ...blockers
  ]);
}
function reconstructPath(metadata, goalIdx) {
  const path = [];
  let idx = goalIdx;
  while (metadata.parentIndexes[idx] !== -1) {
    path.push([
      metadata.fromPositions[idx],
      metadata.toPositions[idx]
    ]);
    idx = metadata.parentIndexes[idx];
  }
  path.reverse();
  return path.map(([from, to]) => [
    {
      x: from % COLS,
      y: from / COLS | 0
    },
    {
      x: to % COLS,
      y: to / COLS | 0
    }
  ]);
}
function stateKeyAt(pool, config, offset) {
  let key = 0;
  for (let pieceIdx = 0; pieceIdx < config.pieceCount; pieceIdx++) {
    key = key * 64 + pool[offset + pieceIdx];
  }
  return key;
}

// game/solver-worker.ts
self.onmessage = (e) => {
  try {
    for (const event of solve(e.data)) {
      self.postMessage(event);
      if (event.type === "solution") return;
    }
  } catch (err) {
    const event = {
      type: "error",
      message: err instanceof Error ? err.message : "Solver failed"
    };
    self.postMessage(event);
  }
};
