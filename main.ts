import { App, staticFiles } from "fresh";

export const app = new App();

// Add static file serving middleware
app.use(staticFiles());

// Enable file-system based routing
app.fsRoutes();
