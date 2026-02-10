import { HttpError, PageProps } from "fresh";

import { Header } from "#/components/header.tsx";
import { Main } from "#/components/main.tsx";
import { Panel } from "#/components/panel.tsx";
import { cn } from "#/lib/style.ts";
import { define } from "#/core.ts";

export default define.page(function ErrorPage(props: PageProps) {
  const error = props.error;

  let status = 500;
  let title = "Something went wrong";
  let message = "An unexpected error occurred.";

  if (error instanceof HttpError) {
    status = error.status;
    message = error.message;
  }

  if (status === 404) {
    title = "Page not found";

    if (!message) {
      message = "The page you were looking for doesn't exist.";
    }
  }

  if (status === 400) {
    title = "Huh? That's not supposed to happen";
    if (!message) {
      message = "The request doesn't seem to be valid.";
    }
  }

  const navItems = [
    { name: "home", href: "/" },
  ];

  return (
    <>
      <Main className="max-lg:row-span-full">
        <Header url={props.url} items={navItems} />

        <div className="flex flex-col gap-fl-2 py-fl-3">
          <ErrorAnimation />

          <h1 className="text-fl-2">{title}</h1>
          <p className="text-fl-1 text-text-2">{message} ({status})</p>
        </div>
      </Main>

      <Panel>
        <span />
      </Panel>
    </>
  );
});

const CELLS = 8;
const WALL_COL = 4;

function ErrorAnimation() {
  return (
    <>
      <style>
        {`
        @keyframes error-rook {
          0%, 10% { --x: 0 }
          35%, 60% { --x: ${WALL_COL} }
          85%, 100% { --x: 0 }
        }
      `}
      </style>

      <div
        style={{
          "--gap": "var(--size-1)",
          "--space-w": "clamp(32px, 8vw, 48px)",
        }}
        className="grid gap-(--gap) grid-cols-[repeat(8,var(--space-w))] grid-rows-[repeat(2,var(--space-w))]"
      >
        {/* Board spaces */}
        {Array.from({ length: CELLS + 5 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "aspect-square rounded-1",
              "border-1 border-stone-9 border-r-stone-7 border-b-stone-7",
              i === WALL_COL + 2 && "border-l-2 border-l-ui-4",
            )}
            style={{
              gridColumn: i % CELLS,
              gridColumnEnd: i % CELLS + 1,
              gridRow: Math.ceil(i / CELLS),
              gridRowEnd: Math.ceil(i / CELLS) + 1,
            }}
          />
        ))}

        {/* Destination (X marker) */}
        <div className="col-7 row-1 aspect-square place-self-center border-2 border-ui-1 pointer-events-none">
          <svg className="text-ui-1" viewBox="0 0 100 100">
            <line
              x1={0}
              y1={0}
              x2={100}
              y2={100}
              strokeWidth={3}
              stroke="currentColor"
            />
            <line
              x1={0}
              y1={100}
              x2={100}
              y2={0}
              strokeWidth={3}
              stroke="currentColor"
            />
          </svg>
        </div>

        {/* Rook (animated) */}
        <div
          className={cn(
            "col-1 row-1 p-(--pad)",
            "w-full aspect-square place-self-center",
            "translate-x-[calc((var(--space-w)+var(--gap))*var(--x))]",
            "transition-[--x] ease-out",
          )}
          style={{
            "--pad": "var(--size-2)",
            animation: "error-rook 3s ease-in-out infinite",
          }}
        >
          <div className="w-full h-full bg-ui-2 rounded-round" />
        </div>
      </div>
    </>
  );
}
