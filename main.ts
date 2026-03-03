import { App, staticFiles } from "fresh";

import { State } from "#/core.ts";
import { posthogProxy } from "#/middleware/posthog-proxy.ts";
import { theme } from "#/middleware/theme.ts";
import { tracking } from "#/middleware/tracking.ts";

export const app = new App<State>();

// Add static file serving middleware
app.use(staticFiles());

// Add middlewares
app.use(posthogProxy);
app.use(tracking);
app.use(theme);

// Enable file-system based routing
app.fsRoutes();
