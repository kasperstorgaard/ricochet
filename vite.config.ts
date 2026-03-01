// deno-lint-ignore-file skub-imports/use-hash-alias
import { fresh } from "@fresh/plugin-vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

import { puzzleManifest } from "./plugins/puzzle-manifest.ts";

export default defineConfig({
  plugins: [
    puzzleManifest(),
    tailwindcss(),
    fresh(),
  ],
});
