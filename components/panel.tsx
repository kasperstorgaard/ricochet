import { ComponentChildren } from "preact";
import { cn } from "#/lib/style.ts";

type PanelProps = {
  children: ComponentChildren;
  className?: string;
};

/**
 * Shared panel component for sidebars
 * - Mobile/tablet: Bottom panel spanning full width
 * - Large screens: Fixed right sidebar
 */
export function Panel({ children, className }: PanelProps) {
  return (
    <aside
      className={cn(
        "col-span-3 grid grid-cols-subgrid place-content-start max-md:min-h-[min(25vh,20rem)]",
        "border-t-2 border-brand bg-surface-2 text-fl-1 py-fl-3",
        "lg:col-start-2 lg:col-span-1 lg:grid-rows-subgrid lg:row-span-full lg:px-fl-2",
        className,
      )}
    >
      {children}
    </aside>
  );
}
