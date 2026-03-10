# Eliminate render-blocking CSS/font CDN dependencies

## Problem

Three external resources block rendering on every page load:

1. `unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css` — 983ms blocking, 98.6% unused rules, triggers a 147KB `.woff2` font download with no `font-display`
2. `fonts.googleapis.com/css2?family=Chakra+Petch...` — 804ms blocking, just to serve `@font-face` declarations for files hosted on `fonts.gstatic.com`
3. `/assets/client-entry-*.css` — app CSS, unavoidable but worth keeping lean

Combined FCP impact: ~820ms.

## Solution

### 1. Replace Phosphor web font with `@phosphor-icons/core` + SVG component

Instead of loading a CSS+woff2 icon font from unpkg, render icons as inline SVGs server-side using `@phosphor-icons/core` (SVG path data only, no React dependency).

**New component** — `components/icon.tsx`:
- Accepts an icon object from `@phosphor-icons/core` + optional `class` prop
- Renders a `<svg width="1em" height="1em">` so icons scale with `text-*` classes exactly as before
- Uses `fill="currentColor"` so color inherits from text color
- `aria-hidden="true"` by default (icons are decorative)

**Migration**: Replace all `<i className="ph ph-name extra">` usages with `<Icon icon={Name} class="extra" />` across 19 files (33 instances).

Remove the Phosphor `<link>` from `_app.tsx`.

### 2. Self-host Chakra Petch

Download the three `.woff2` files (weights 300, 400, 500) from Google Fonts and serve them from `/static/fonts/`. Add `@font-face` declarations with `font-display: swap` in `styles.css`. Remove both `<link rel="preconnect">` and the `fonts.googleapis.com` stylesheet link from `_app.tsx`.

## Files changed

- `deno.json` — add `@phosphor-icons/core`
- `components/icon.tsx` — new SVG icon wrapper
- `components/header.tsx`, `components/pagination.tsx`, `components/puzzle-card.tsx`, `components/select.tsx` — icon migration
- `islands/board.tsx`, `islands/controls-panel.tsx`, `islands/difficulty-badge.tsx`, `islands/editable-name.tsx`, `islands/editor-panel.tsx`, `islands/editor-toolbar.tsx`, `islands/share-button.tsx`, `islands/solution-dialog.tsx`, `islands/tutorial-dialog.tsx` — icon migration
- `routes/contribute.tsx`, `routes/index.tsx`, `routes/profile.tsx`, `routes/puzzles/index.tsx`, `routes/puzzles/[slug]/solutions/index.tsx`, `routes/puzzles/[slug]/solutions/[solutionId].tsx` — icon migration
- `routes/_app.tsx` — remove Phosphor link, remove Google Fonts links
- `styles.css` — add `@font-face` for Chakra Petch
- `static/fonts/` — add 3 Chakra Petch woff2 files
- `.claude/skills/frontend/ui-style.md` — update icon approach note
