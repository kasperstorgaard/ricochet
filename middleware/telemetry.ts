import { trace } from "@opentelemetry/api";

import { define } from "#/core.ts";

/**
 * Annotates the active OTEL span with useful request attributes.
 */
export const telemetry = define.middleware((ctx) => {
  const span = trace.getActiveSpan();

  const ua = ctx.req.headers.get("user-agent");

  if (ua) span?.setAttribute("http.user_agent", ua);
  return ctx.next();
});
