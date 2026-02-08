import { cn } from "#/lib/style.ts";
import { define } from "#/core.ts";
import { CookieBanner } from "#/islands/cookie-banner.tsx";
import { TrackingScript } from "#/islands/tracking-script.tsx";

export default define.page(
  function AppWrapper({ Component, state, url }) {
    // Don't show the cookie dialog on tutorial, too distracting and double modal.
    const isTutorial = url.pathname.endsWith("/tutorial");

    return (
      <html className="min-h-screen">
        <head>
          <meta charset="utf-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <title>Ricochet</title>
          <link rel="icon" type="image/svg+xml" href="/favicon-light.svg" />
          <link
            rel="icon"
            type="image/svg+xml"
            href="/favicon-dark.svg"
            media="(prefers-color-scheme: dark)"
          />
          <link
            rel="stylesheet"
            type="text/css"
            href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css"
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
            "sm:grid-cols-[minmax(var(--size-fluid-3),auto)_max-content_minmax(var(--size-fluid-3),auto)]",
            "grid-rows-[repeat(3,max-content)_1fr] place-items-[flex-end_center] gap-y-fl-3",
            "lg:grid-cols-[1fr_13rem] lg:content-center",
          )}
        >
          <Component />
          {!isTutorial && (
            <CookieBanner
              open={!state.trackingAllowed && !state.trackingDeclined}
            />
          )}
          <TrackingScript
            apiKey={Deno.env.get("POSTHOG_API_KEY")!}
            trackingAllowed={state.trackingAllowed}
            trackingId={state.trackingId}
          />
        </body>
      </html>
    );
  },
);
