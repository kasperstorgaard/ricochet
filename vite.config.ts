import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";
import tailwindcss from "@tailwindcss/vite";

import { puzzleManifest } from "./plugins/puzzle-manifest.ts";

export default defineConfig({
  plugins: [
    puzzleManifest(),
    tailwindcss(),
    fresh(),
  ],
});
