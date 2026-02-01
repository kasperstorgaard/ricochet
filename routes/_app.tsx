import { type PageProps } from "$fresh/server.ts";
import { cn } from "#/lib/style.ts";
export default function App({ Component }: PageProps) {
  return (
    <html className="flex flex-col min-h-screen">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Ricochet</title>
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
          "grid-rows-[repeat(3,max-content)_1fr] place-items-[flex-end_center] gap-y-fl-3",
          "lg:grid-cols-[1fr_minmax(20vw,min-content)] lg:content-center",
        )}
      >
        <Component />
      </body>
    </html>
  );
}
