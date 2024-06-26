import {
  extendTailwindMerge,
} from "https://cdn.jsdelivr.net/npm/tailwind-merge/+esm";
import twConfig from "../tailwind.config.ts";

// deno-lint-ignore no-explicit-any
const extended = extendTailwindMerge(twConfig) as any;

export function cn(...classes: unknown[]) {
  return extended(classes);
}
