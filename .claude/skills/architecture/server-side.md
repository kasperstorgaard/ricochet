# Server-side approach

## Default to the server

Page-level GET/POST handlers are the primary way of getting data / performing
actions. API routes are for actions that are independent from routes. API routes
can be either triggered by url/form or client side.

Client side is progressive enhancement, it cannot be the primary experience of
the user. One exception: the editor. The editor is in itself a supplement to the
game, so here client side is required and relied upon.

## Static data

Static data is the first storage for the game's most important data — the
puzzles. This means that puzzles go through GitHub, which gives the benefit of a
PR approval flow and manual decision on how difficult each puzzle is.

## Cookies

See state.md for the storage hierarchy and rationale.

## Redirects

Always use **303 See Other** for redirects from route handlers and API routes.
303 is correct for POST-redirect-GET and for GET handlers that redirect to a
canonical URL — it tells the browser to follow with a GET regardless of the
original method, and avoids re-submission on back/forward.

```ts
// GET handler redirecting to canonical URL
return Response.redirect(url, 303);

// POST handler (e.g. form submission) redirecting after action
return new Response(null, { headers, status: 303 });
```

Use **301** only for permanently renamed/moved resources — as browsers cache it.

Never use 302 — it has the same semantics as 303 in practice but is semantically
ambiguous and easy to misuse.

## Responsibility split

Core game logic lives in `game`, along with parsing and formatting puzzles.
Route-specific logic lives in handlers — medium-sized handlers with a few edge
case checks are fine, and some duplication between handlers is acceptable. When
edge cases multiply or duplication gets high, consider whether the logic belongs
in an API route or is core enough for `game`.

`client` holds browser-only code: hooks, touch handling, keyboard handling, and
routing. `lib` holds portable utilities that are neither game-specific nor
browser-specific: env detection, analytics setup, replay, build tools.
