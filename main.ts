import { App, staticFiles } from "fresh";
import { posthogProxy } from "./middleware/posthog-proxy.ts";
import { tracking } from "./middleware/tracking.ts";
import { State } from "#/core.ts";

export const app = new App<State>();

// Add static file serving middleware
app.use(staticFiles());

// Add middlewares
app.use(posthogProxy);
app.use(tracking);

// Enable file-system based routing
app.fsRoutes();
