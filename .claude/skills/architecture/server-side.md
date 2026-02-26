# Server-side approach

## Default to the server

Page-level GET/POST handlers are the primary way of getting data / performing
actions. api routes are for actions that are indenpendent from routes. API
routes can be either triggered by url/form or client side.

Client side is progressive enhancement, it cannot be the primary experience of
the user. One exception: the editor. The editor is in itself a supplement to the
game, so here client side is required and relied upon.

## Static data

Static data is the first storage for the games most important data -> the
puzzles. This means that puzzles go through github, which in gives the benefit
of a PR approval flow and manual decision on how difficult each puzzle is.

## KV

Deno kv is the backend of the app. Data that is shared across users go here.
This is only solutions at the moment, but can be expanded.

## Cookies

Cookies is the user-data storage of the app. Since we don't have, and don't plan
to have signed in users, we use cookies for everything tied to the user. This
gives the benefit of sticking to the server -> client flow, and avoiding
rehydration and localstorage syncing issues. It has the drawback of being
limited in size, but that forces us to make the right decisions on the total
amount of features that rely on user data.

## Responsibility split

Core game logic lives in util, along with core functionality such as parsing and
formatting puzzles. Route specific logic lives in handlers, and it is ok for
them to get medium sized and have a couple of edge case checks. Some duplication
of logic between handlers is also ok. If the edge cases get too many or
duplication gets high, consider if api/routes is a better fit, or if the logic
is core enough to go into util helpers.

Lib contains anything that could be feasibly exported as a 3rd party library,
like hooks and tracking wrappers, touch etc.
