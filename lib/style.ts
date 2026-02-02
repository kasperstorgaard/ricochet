import { twMerge } from "npm:tailwind-merge@2.5.3";

export function cn(...classes: unknown[]) {
  return twMerge(
    classes.filter((value) => typeof value === "string"),
  );
}
