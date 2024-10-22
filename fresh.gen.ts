// DO NOT EDIT. This file is generated by Fresh.
// This file SHOULD be checked into source version control.
// This file is automatically updated during development when running `dev.ts`.

import * as $_404 from "./routes/_404.tsx";
import * as $_app from "./routes/_app.tsx";
import * as $index from "./routes/index.tsx";
import * as $puzzles_puzzleId_index from "./routes/puzzles/[puzzleId]/index.tsx";
import * as $puzzles_puzzleId_solutions_solutionId_ from "./routes/puzzles/[puzzleId]/solutions/[[solutionId]].tsx";
import * as $puzzles_index from "./routes/puzzles/index.tsx";
import * as $puzzles_new from "./routes/puzzles/new.tsx";
import * as $board from "./islands/board.tsx";
import * as $controls_panel from "./islands/controls-panel.tsx";
import * as $editor_panel from "./islands/editor-panel.tsx";
import * as $solution_dialog from "./islands/solution-dialog.tsx";
import * as $solutions_panel from "./islands/solutions-panel.tsx";
import { type Manifest } from "$fresh/server.ts";

const manifest = {
  routes: {
    "./routes/_404.tsx": $_404,
    "./routes/_app.tsx": $_app,
    "./routes/index.tsx": $index,
    "./routes/puzzles/[puzzleId]/index.tsx": $puzzles_puzzleId_index,
    "./routes/puzzles/[puzzleId]/solutions/[[solutionId]].tsx":
      $puzzles_puzzleId_solutions_solutionId_,
    "./routes/puzzles/index.tsx": $puzzles_index,
    "./routes/puzzles/new.tsx": $puzzles_new,
  },
  islands: {
    "./islands/board.tsx": $board,
    "./islands/controls-panel.tsx": $controls_panel,
    "./islands/editor-panel.tsx": $editor_panel,
    "./islands/solution-dialog.tsx": $solution_dialog,
    "./islands/solutions-panel.tsx": $solutions_panel,
  },
  baseUrl: import.meta.url,
} satisfies Manifest;

export default manifest;
