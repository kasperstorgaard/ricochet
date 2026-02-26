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

## Responsibility split

Core game logic lives in `util`, along with parsing and formatting puzzles.
Route-specific logic lives in handlers — medium-sized handlers with a few edge
case checks are fine, and some duplication between handlers is acceptable. When
edge cases multiply or duplication gets high, consider whether the logic belongs
in an API route or is core enough for `util`.

`lib` holds client-side code that could reasonably be a standalone library:
hooks, tracking wrappers, touch handling, etc.
