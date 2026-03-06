# Spec: Player onboarding

## Context

New users were hard-redirected to the tutorial on first visit, which felt
pushy. Rather than a one-shot tutorial gate, this replaces it with a
progressive onboarding flow — the home page and controls adapt to where the
player is in their journey, nudging them forward without forcing anything.

## Onboarding state

The `onboarding` cookie tracks progression as an enum:

| Value | Meaning |
|---|---|
| `"new"` | Brand new — hasn't seen the tutorial yet |
| `"started"` | Has visited the tutorial, not yet a confident solver |
| `"done"` | Solved a puzzle well — full experience unlocked |

Transitions:
- Default (no cookie): `"new"`
- Visiting the tutorial page: `"new"` → `"started"`
- Solving any puzzle within 1.33× its `minMoves`: → `"done"`

## Plan

### `game/cookies.ts` — onboarding cookie

Replace the boolean `skip_tutorial` cookie with an `onboarding` cookie
typed as `"new" | "started" | "done"`. Update getters/setters.

### `routes/index.tsx` — home page adapts to onboarding state

- **`"new"`**: show tutorial link card in the random puzzle slot. Review
  the "Let's go" CTA copy — it should point toward the tutorial.
- **`"started"`**: show an easy random puzzle in the random puzzle slot with
  a warmer tagline (e.g. "Warm-up puzzle" instead of "Random puzzle").
- **`"done"`**: existing behaviour — random puzzle, normal tagline.

### `routes/puzzles/tutorial/index.tsx` (or handler) — advance state

On visiting the tutorial, set state to `"started"` if currently `"new"`.

### `routes/puzzles/[slug]/index.tsx` — complete onboarding on good solve

After a successful solve within 1.33× `minMoves`, set state to `"done"`.
Pass a `onboardingCompleted` flag to the page (true only on the transition,
not on subsequent solves when already `"done"`) so the solution dialog can
show the one-time message.

### `islands/solution-dialog.tsx` — one-time onboarding completion message

When `onboardingCompleted` is true, show a brief congratulatory message
acknowledging the player has found their feet. Fire a `onboarding_completed`
PostHog event at this moment. The flag is never set again once `"done"` is
already the stored state, so the message is guaranteed to appear exactly once.

### `islands/controls-panel.tsx` — tutorial button until onboarding complete

Show the Tutorial button (hide Remix) for both `"new"` and `"started"`
states. Only show Remix once `"done"`. This keeps the tutorial revisitable
throughout the onboarding phase.
