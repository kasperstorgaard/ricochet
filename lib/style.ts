import { extendTailwindMerge } from "npm:tailwind-merge@2.5.3";
import twConfig from "../tailwind.config.ts";

// deno-lint-ignore no-explicit-any
const extended = extendTailwindMerge(twConfig as any);

export function cn(...classes: unknown[]) {
  return extended(
    classes.map((value) => typeof value === "string" ? value : false),
  );
}
