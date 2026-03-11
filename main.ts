import { App, staticFiles } from "fresh";

import { State } from "#/core.ts";
import { posthogProxy } from "#/middleware/posthog-proxy.ts";
import { telemetry } from "#/middleware/telemetry.ts";

export const app = new App<State>();

// Add static file serving middleware
app.use(staticFiles());

// Add middlewares
app.use(telemetry);
app.use(posthogProxy);

// Enable file-system based routing
app.fsRoutes();
