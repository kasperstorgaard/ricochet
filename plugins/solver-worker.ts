import { denoPlugin } from "@deno/esbuild-plugin";
import * as esbuild from "esbuild";
import type { Plugin } from "vite";

/**
 * Vite plugin that bundles game/solver-worker.ts → static/solver-worker.js.
 *
 * Runs at build start (both dev and prod). The output is served as a static
 * asset, so the server can spin up workers from the request origin URL without
 * relying on import.meta.url resolution, which breaks on Deno Deploy.
 */
export function solverWorker(): Plugin {
  return {
    name: "solver-worker",
    async buildStart() {
      await esbuild.build({
        plugins: [denoPlugin()],
        entryPoints: ["./game/solver-worker.ts"],
        outfile: "./static/solver-worker.js",
        bundle: true,
        format: "esm",
        target: "esnext",
      });
    },
  };
}
