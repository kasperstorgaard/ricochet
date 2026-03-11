import { App, staticFiles } from "fresh";

import { State } from "#/core.ts";
import { auth } from "#/middleware/auth.ts";
import { onboarding } from "#/middleware/onboarding.ts";
import { posthogProxy } from "#/middleware/posthog-proxy.ts";
import { telemetry } from "#/middleware/telemetry.ts";
import { theme } from "#/middleware/theme.ts";
import { tracking } from "#/middleware/tracking.ts";

export const app = new App<State>();

// Add static file serving middleware
app.use(staticFiles());

// Add middlewares
app.use(telemetry);
app.use(posthogProxy);
app.use(tracking);
app.use(auth);
app.use(theme);
app.use(onboarding);

// Enable file-system based routing
app.fsRoutes();
