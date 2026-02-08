import { ComponentChildren } from "preact";

import { cn } from "#/lib/style.ts";

type MainProps = {
  children: ComponentChildren;
  className?: string;
};

/**
 * Shared component for main content
 */
export function Main({ children, className }: MainProps) {
  return (
    <main
      className={cn(
        "grid grid-rows-subgrid row-span-3 col-[2/3] w-full gap-fl-2 pt-fl-2 place-content-center",
        "lg:col-[1/2] lg:mx-auto lg:max-w-lg lg:px-fl-3 lg:self-end lg:row-span-full lg:pb-fl-2",
        className,
      )}
    >
      {children}
    </main>
  );
}
