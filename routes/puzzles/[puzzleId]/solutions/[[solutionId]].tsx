import {
  Board as BoardState,
  type Move,
  type Position,
  Puzzle,
  Solution,
} from "#/db/types.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { useSignal } from "@preact/signals";

import {
  getPuzzle,
  getSolution,
  getSolutionRank,
  listSolutions,
} from "#/db/kv.ts";
import Board from "#/islands/board.tsx";
import { SolutionsPanel } from "#/islands/solutions-panel.tsx";
import { encodeState } from "#/util/url.ts";
import { getPieceId, isPositionSame, resolveMoves } from "#/util/board.ts";

type Data = {
  puzzle: Puzzle;
  solutions: Solution[];
  solution: Solution | null;
  rank: number;
};

export const handler: Handlers<Data> = {
  async GET(req, ctx) {
    const { puzzleId, solutionId } = ctx.params;

    const puzzle = await getPuzzle(puzzleId);
    if (!puzzle) {
      throw new Error(`Unable to find a puzzle with id: ${puzzleId}`);
    }

    const solutions = await listSolutions(puzzleId);

    const solution = solutionId
      ? await getSolution(puzzleId, solutionId)
      : solutions[0];

    if (!solution) {
      throw new Error(`Unable to find solution with id: ${solutionId}`);
    }

    const url = new URL(req.url);
    if (!url.searchParams.has("m")) {
      url.search = encodeState({
        moves: solution.moves,
      });

      return Response.redirect(url, 301);
    }

    const rank = await getSolutionRank(puzzleId, solutionId);

    return ctx.render({
      puzzle,
      solutions,
      solution,
      rank,
    });
  },
};

export default function SolutionPage(props: PageProps<Data>) {
  const puzzle = useSignal(props.data.puzzle);
  const href = useSignal(props.url.href);
  const hasSolution = useSignal(false);

  return (
    <>
      <div class="flex flex-col col-[2/3] w-full gap-2 py-1">
        <Board
          puzzle={puzzle}
          href={href}
          hasSolution={hasSolution}
          isReplayMode
        />
      </div>

      <SolutionsPanel
        solutions={props.data.solutions}
        solution={props.data.solution}
        href={href}
      />

      <style>
        {buildReplayStyles(
          props.data.puzzle.board,
          props.data.solution?.moves ?? [],
        )}
      </style>
    </>
  );
}

function buildReplayStyles(board: BoardState, moves: Move[]) {
  if (!moves.length) return "";

  const pieceMovesLookup: Record<string, { idx: number; move: Move }[]> = {};
  const totalMoves = moves.length;

  for (let idx = 0; idx < moves.length; idx++) {
    const move = moves[idx];

    const state = resolveMoves(board, moves.slice(0, idx));
    const piece = state.pieces.find((item) => isPositionSame(item, move[0]));
    if (!piece) continue;

    const id = getPieceId(piece, state.pieces.indexOf(piece));

    if (!pieceMovesLookup[id]) pieceMovesLookup[id] = [{ idx, move }];
    else pieceMovesLookup[id].push({ idx, move });
  }

  let output = "";

  for (const [id, pieceMoves] of Object.entries(pieceMovesLookup)) {
    const increment = 100 / totalMoves;
    output += `@keyframes replay-${id} {\n`;
    // Make sure the piece starts off in the right position.
    output += writeKeyframeMove(0, pieceMoves[0].move[0]);

    for (const { idx, move } of pieceMoves) {
      /*
       * Set a start position just before animating,
      to make sure the animation happens in single steps, not all the way from the start.
       */
      output += writeKeyframeMove((idx - 1) * increment, move[0]);
      // Animate to the new position.
      output += writeKeyframeMove(idx * increment, move[1]);
    }

    output += "}\n\n";
  }

  return output;
}

function writeKeyframeMove(percentage: number, position: Position) {
  return `  ${percentage}% { --x: ${position.x}; --y: ${position.y}; }\n`;
}
