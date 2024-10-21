import { type PageProps } from "$fresh/server.ts";
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
          href="https://fonts.googleapis.com/css2?family=Chakra+Petch:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap"
          rel="stylesheet"
        />
      </head>

      <body className="grid grid-cols-[minmax(var(--size-fluid-1),auto)_max-content_minmax(var(--size-fluid-1),auto)] items-end place-items-center grow gap-y-fl-3 pt-fl-2">
        <Component />
      </body>
    </html>
  );
}
