import { type PageProps } from "$fresh/server.ts";
import { cn } from "#/lib/style.ts";
export default function App({ Component }: PageProps) {
  return (
    <html className="flex flex-col min-h-screen">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>ricochet</title>
        <link rel="stylesheet" href="/styles.css" />
        <link
          rel="stylesheet"
          type="text/css"
          href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/light/style.css"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="crossOrigin"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>

      <body
        className={cn(
          "grow grid grid-cols-[minmax(var(--size-fluid-1),auto)_max-content_minmax(var(--size-fluid-1),auto)]",
          "grid-rows-[1fr] place-items-[flex-end_center] auto-rows-max gap-y-fl-3",
          "pt-fl-2",
        )}
      >
        <Component />
      </body>
    </html>
  );
}
