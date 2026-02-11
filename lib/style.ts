import { extendTailwindMerge } from "tailwind-merge";

// TODO: replace tailwind-merge with a plain class joiner — custom utilities
// (text-5, text-fl-0, etc.) need manual registration here to avoid being
// misclassified as text-color and silently dropped.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "00",
            "0",
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "fl-0",
            "fl-1",
            "fl-2",
            "fl-3",
          ],
        },
      ],
    },
  },
});

export function cn(...classes: unknown[]) {
  return twMerge(
    classes.filter((value) => typeof value === "string"),
  );
}
