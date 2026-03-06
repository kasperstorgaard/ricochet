# A11y: Opacity cleanup + theme contrast audit

## What was done

### 1. Replace opacity-based dimming with semantic color tokens

`opacity-70/opacity-100` on interactive elements multiplicatively reduces contrast
and has no WCAG exemption. Replaced with `text-text-2 → hover:text-link` transitions.

**Files changed:**
- `islands/share-button.tsx` — `opacity-70/hover:opacity-100` → `text-text-2/hover:text-link`
- `islands/theme-picker.tsx` — same replacement on the trigger button

**Kept as-is (WCAG 1.4.3 exempt — inactive UI components):**
- `styles/buttons.css` — `filter: opacity(0.4)` on disabled primary buttons (reduced from 0.6 for stronger visual signal)
- `styles.css` — `filter: opacity(0.8)` on `a[aria-disabled]`

**Kept as-is (animations/decorative):**
- `islands/tutorial-dialog.tsx` — `opacity-0 animate-fade-in` entry animation
- `routes/puzzles/new.tsx` — `group-focus-within:opacity-0` label hide on focus
- `islands/board.tsx` — `opacity-20` board overlay
- `islands/cookie-banner.tsx` — `opacity-80` decorative SVG

### 2. WCAG AA audit: surface-{1,2} × text-{1,2,3} across all themes

Computed contrast ratios for all theme/surface/text combinations. AA = 4.5:1.

**Results before fixes:**

| Theme | Failing combinations |
|-------|---------------------|
| GitHub Light | s1/t3: 2.91, s2/t3: 2.74 |
| Catppuccin | s1/t2: 4.37, s2/t2: 4.06, s1/t3: 2.83, s2/t3: 2.63 |
| Dracula | s1/t3: 3.03, s2/t3: 3.36 (AA for large text only) |
| Solarized | s1/t2: 4.03, s2/t2: 3.55, s1/t3: 3.70, s2/t3: 3.26 (large text only) |

All dark themes (Skub, Acid, High Contrast) passed without changes.

### 3. Catppuccin — fix text-2 and text-3

Darkened within the same hue to just meet AA on the stricter surface-2:

- `text-2`: `#6c6f85` → `#5e6176` (s2: 4.06 → 5.01:1)
- `text-3`: `#8c8fa1` → `#646779` (s2: 2.63 → 4.59:1)

### 4. Replace GitHub Light with Ember

GitHub Light had a failing `text-3` and was considered too generic. Replaced with
**Ember** — a warm light theme (red/orange/amber palette, white surfaces).

**Ember palette:**

| Token | Value | Ratio on s2 |
|-------|-------|-------------|
| surface-1 | `#ffffff` | — |
| surface-2 | `#faf6f1` | — |
| surface-3 | `#f0e8dc` | — |
| surface-4 | `#e0d0bc` | — |
| text-1 | `#2d1a0e` | 15.42:1 ✓ |
| text-2 | `#6b3a1f` | 8.67:1 ✓ |
| text-3 | `#7a4a2a` | 6.87:1 ✓ |
| brand | `#b91c1c` | — |
| link | `#0f766e` (teal) | — |
| ui-1 destination | `#166534` (forest green) | — |
| ui-2 puck | `#ea580c` (orange) | — |
| ui-3 blockers | `#b91c1c` (crimson) | — |
| ui-4 walls | `#374151` (charcoal) | — |

**Colorblind safety:** ui colors use four perceptually distinct hues (green, orange,
red, charcoal) across the main color vision deficiency types. Link teal is distinct
from brand red.

### 5. Related visual fixes

**Move guide targets** (`islands/board.tsx`) — `border-1` → `border-2` for more
visible move targets on the board.

**Visited puzzle thumbnail dimming** (`styles.css`) — `:visited` svg-dim
`color-mix` changed from 50% → 70% colour retention. Visited puzzles are now
more subtly muted rather than heavily washed out.

### 6. Dracula and Solarized Light — fix remaining text tokens

Minimally darkened/lightened within the same hue to just meet AA:

**Dracula** (dark theme — text lightened for contrast on dark bg):
- `text-3`: `#6272a4` → `#8090c2` (s1: 3.03 → 4.53:1)

**Solarized Light** (light theme — text darkened):
- `text-2`: `#6d7c7d` → `#5e6b6c` (s2: 3.55 → 4.52:1)
- `text-3`: `#748282` → `#626969` (s2: 3.26 → 4.58:1)
