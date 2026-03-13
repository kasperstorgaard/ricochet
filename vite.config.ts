// deno-lint-ignore-file skub-imports/use-hash-alias
import { fresh } from "@fresh/plugin-vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

import { puzzleManifest } from "./plugins/puzzle-manifest.ts";
import { solverWorker } from "./plugins/solver-worker.ts";

export default defineConfig({
  plugins: [
    solverWorker(),
    puzzleManifest(),
    tailwindcss(),
    fresh(),
  ],
});
