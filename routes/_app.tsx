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
          href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/bold/style.css"
        />
      </head>
      <body className="grid grid-rows-[1fr] grid-cols-[minmax(0,auto)_max-content_minmax(0,auto)] place-items-center grow">
        <Component />
      </body>
    </html>
  );
}
