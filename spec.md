# Spec: Player onboarding

## Context

New users were hard-redirected to the tutorial on first visit, which felt
pushy. Rather than a one-shot tutorial gate, this replaces it with a
progressive onboarding flow — the home page and controls adapt to where the
player is in their journey, nudging them forward without forcing anything.

## Onboarding state

The `onboarding` cookie tracks progression as an enum, set by `middleware/onboarding.ts`
and available on all routes via `ctx.state.onboarding`:

| Value | Meaning |
|---|---|
| `"new"` | Brand new — hasn't seen the tutorial yet |
| `"started"` | Has visited the tutorial, not yet a confident solver |
| `"done"` | Solved a puzzle well — full experience unlocked |

Transitions:
- Default (no cookie): `"new"`
- Visiting the tutorial page: `"new"` → `"started"` (set on the redirect GET)
- Solving any puzzle within 1.33× its `minMoves`: → `"done"`

Legacy fallback: `skip_tutorial=true` → `"done"`, so existing users are unaffected.

## Plan

### `game/types.ts` + `core.ts`

Add `Onboarding = "new" | "started" | "done"` to types. Add `onboarding: Onboarding`
to `State`.

### `game/cookies.ts` — onboarding cookie

Replace the boolean `skip_tutorial` cookie with an `onboarding` cookie.
`getOnboardingCookie` reads the new cookie with a legacy fallback.

### `middleware/onboarding.ts`

Reads the cookie and sets `ctx.state.onboarding` on every request.

### `routes/index.tsx` — home page adapts to onboarding state

- **`"new"`**: tutorial link card in the random puzzle slot, with "New here?" /
  "Learn the basics" tagline to match the puzzle card weight.
- **`"started"`**: easy random puzzle with "Warm-up puzzle" tagline.
- **`"done"`**: random puzzle with "Random puzzle" tagline.

### `routes/puzzles/tutorial.tsx` — advance state on visit

On the initial GET (before the `?moves` redirect), set state to `"started"` if
currently `"new"`. Tutorial POST just redirects home — no cookie change.

### `routes/puzzles/[slug]/index.tsx` — complete onboarding on good solve

After a successful solve within 1.33× `minMoves`, set state to `"done"` and
fire the `onboarding_completed` PostHog event (server-side, same shape as
`puzzle_solved`).

### `islands/solution-dialog.tsx` — one-time graduation message

When `onboarding !== "done"` and the solve is within 1.33× `minMoves`, show
"You've found your feet — the full puzzle archive is yours now." in place of
the standard post-solve copy.

### `islands/controls-panel.tsx` — tutorial button until onboarding complete

Show the Tutorial button (hide Remix) for `"new"` and `"started"`. Only show
Remix once `"done"`.
