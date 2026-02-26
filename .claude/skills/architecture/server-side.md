# Server-side approach

## Default to the server

Page-level GET/POST handlers are the primary way of getting data / performing
actions. API routes are for actions that are independent from routes. API
routes can be either triggered by url/form or client side.

Client side is progressive enhancement, it cannot be the primary experience of
the user. One exception: the editor. The editor is in itself a supplement to the
game, so here client side is required and relied upon.

## Static data

Static data is the first storage for the game's most important data — the
puzzles. This means that puzzles go through GitHub, which gives the benefit
of a PR approval flow and manual decision on how difficult each puzzle is.

## Cookies

See state.md for the storage hierarchy and rationale.

## Responsibility split

Core game logic lives in util, along with core functionality such as parsing and
formatting puzzles. Route specific logic lives in handlers, and it is ok for
them to get medium sized and have a couple of edge case checks. Some duplication
of logic between handlers is also ok. If the edge cases get too many or
duplication gets high, consider if api/routes is a better fit, or if the logic
is core enough to go into util helpers.

Lib contains anything that could be feasibly exported as a 3rd party library,
like hooks and tracking wrappers, touch etc.
