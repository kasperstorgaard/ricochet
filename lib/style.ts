import { twMerge } from "tailwind-merge";

export function cn(...classes: unknown[]) {
  return twMerge(
    classes.filter((value) => typeof value === "string"),
  );
}
