# Store username in KV

## Context

When a user submits a solution, they enter a display name. Currently this is not
persisted — every solve requires re-entering it. Storing it against the user's KV
identity means it can be pre-filled on subsequent solves.

## What changes

### KV key

```
["user", userId, "name"] → string
```

### `db/user.ts`
Add `getUserName(userId)` and `setUserName(userId, name)`.

### `routes/puzzles/[slug]/index.tsx`
- POST handler: call `setUserName` with the submitted name after a successful solve.
- GET handler: read `getUserName` and pass it to the page as `savedName`.

### Solution dialog / form
Pre-fill the name input with `savedName` if present.
