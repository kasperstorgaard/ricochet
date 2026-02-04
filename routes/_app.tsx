import { type PageProps } from "fresh";

import { cn } from "#/lib/style.ts";
import { define } from "#/routes/core.ts";

export default define.page(function AppWrapper({ Component }: PageProps) {
  return (
    <html className="flex flex-col min-h-screen">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Ricochet</title>
        <link
          rel="stylesheet"
          type="text/css"
          href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/light/style.css"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossorigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>

      <body
        className={cn(
          "grow grid grid-cols-[minmax(var(--size-fluid-3),auto)_1fr_minmax(var(--size-fluid-3),auto)]",
          "grid-rows-[repeat(3,max-content)_1fr] place-items-[flex-end_center] gap-y-fl-3",
          "lg:grid-cols-[1fr_12rem] lg:content-center",
        )}
      >
        {/* @ts-ignore: Fresh 2.x Component type issue */}
        <Component />
      </body>
    </html>
  );
});
