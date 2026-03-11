# Middleware tracing with OpenTelemetry

## Problem

Server response times are ~700ms but the existing OTEL waterfall shows one
undifferentiated middleware block. There's no way to tell at a glance which
middleware is slow.

## Solution

Add a child span per middleware so each one shows up individually in the
waterfall. DB calls inside a middleware will appear as grandchild spans
naturally via Deno's auto-instrumented `fetch` — no extra instrumentation
needed at the DB layer.

### Shared tracer — `lib/telemetry.ts`

Single `tracer` instance shared across all middlewares:

```ts
import { trace } from "@opentelemetry/api";

export const tracer = trace.getTracer("skub");
```

### Middleware pattern

Each middleware wraps its body in `tracer.startActiveSpan(name, ...)`:

```ts
export const auth = define.middleware((ctx) =>
  tracer.startActiveSpan("middleware.auth", async (span) => {
    try {
      // existing logic
      return await ctx.next();
    } catch (err) {
      span.recordException(err as Error);
      throw err;
    } finally {
      span.end();
    }
  })
);
```

The span name convention is `middleware.<name>` (e.g. `middleware.auth`,
`middleware.theme`).

`posthog-proxy` only creates a span when it actually proxies (i.e. the request
matches `/ph/*`). The early-exit no-op path is not traced.

## Files changed

- `deno.json` — add `@opentelemetry/api` import
- `lib/telemetry.ts` — shared tracer instance
- `middleware/auth.ts` — wrap in `middleware.auth` span
- `middleware/tracking.ts` — wrap in `middleware.tracking` span
- `middleware/theme.ts` — wrap in `middleware.theme` span
- `middleware/onboarding.ts` — wrap in `middleware.onboarding` span
- `middleware/posthog-proxy.ts` — wrap in `middleware.posthog-proxy` span

## Out of scope

- DB/KV call instrumentation (visible as child spans via auto-instrumentation if needed later)
- Route handler spans
- Setting `http.route` on the top-level HTTP span
