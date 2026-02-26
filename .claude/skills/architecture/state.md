# State & data flow

## Decision order

Shared between users: kv (fx. puzzle solutions)

Temporary core state: url (fx. puzzle moves)

User state: cookies (fx. editor stored puzzle)

Consumer order: URL > cookie > static > server-side KV > client signal

## URL state

First important part is the route itself, handled by fresh

Then comes the [slug], which tells us the currently active puzzle

Then comes the game interactions as query params. Every game interaction the
user does should be reflected in the url. This means it is safe, shareable,
recoverable and easy to reason about.

Moves are encoded using chess notation A1-H7

## Cookies

Everything tied to a single user gets stored in cookies. Given the nature of
cookies, this cannot be essential for their experience, but rather an
enhancement. Fx. a list of which puzzles the user has completed: fine for
cookies, you can easily play the game without it.

## Deno KV

Anything that needs to be shared between users. Given we don't have sign in,
this data is not guaranteed unique or anything. fx: "The same user can create
multiple solutions with different names? fine"

## Preact Signals

The big client side progressive enhancement, is that each interaction with the
game does not require a full page reload. This is achieved by passing the core
game state down from server to client islands using signals. These are then
modified, which updates the url state client side on the fly.
