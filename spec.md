# Eliminate render-blocking CSS/font CDN dependencies

## Problem

Three external resources block rendering on every page load:

1. `unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css` — 983ms blocking, 98.6% unused rules, triggers a 147KB `.woff2` font download with no `font-display`
2. `fonts.googleapis.com/css2?family=Chakra+Petch...` — 804ms blocking, just to serve `@font-face` declarations for files hosted on `fonts.gstatic.com`
3. `/assets/client-entry-*.css` — app CSS, unavoidable but worth keeping lean

Combined FCP impact: ~820ms.

## Solution

### 1. Replace Phosphor web font with inline SVGs

Instead of loading a CSS+woff2 icon font from unpkg, render icons as inline SVGs using path data extracted from `@phosphor-icons/core`.

**Codegen script** — `scripts/update-icons.ts`:
- Reads all SVG files from `node_modules/@phosphor-icons/core/assets/regular/`
- Strips the `<svg>` wrapper, keeps the inner path content
- Writes `components/icons.ts` with all ~1300 icons as named exports (`ArrowLeft`, `Check`, etc.)
- Run once after install; re-run only when upgrading `@phosphor-icons/core`
- Add as `deno task update-icons`

**`components/icons.ts`** — single file for everything icon-related:
- Generated path data: all ~1300 icons as named exports (`ArrowLeft`, `Check`, etc.)
- `Icon` component: accepts a path-data string + optional `class` prop, renders `<svg width="1em" height="1em" fill="currentColor">` so icons scale with `text-*` classes as before, `aria-hidden="true"` by default
- One import covers both: `import { Icon, ArrowLeft } from "#/components/icons"`

**Migration**: Replace all `<i className="ph ph-name extra">` usages with `<Icon icon={ArrowLeft} class="extra" />` across 19 files (33 instances).

Remove the Phosphor `<link>` from `_app.tsx`.

### 2. Self-host Chakra Petch

Download the three `.woff2` files (weights 300, 400, 500) from Google Fonts and serve them from `/static/fonts/`. Add `@font-face` declarations with `font-display: swap` in `styles.css`. Remove both `<link rel="preconnect">` and the `fonts.googleapis.com` stylesheet link from `_app.tsx`.

## Files changed

- `deno.json` — remove `@phosphor-icons/core` (not needed at runtime)
- `components/icons.ts` — generated SVG path data + `Icon` component
- `components/header.tsx`, `components/pagination.tsx`, `components/puzzle-card.tsx`, `components/select.tsx` — icon migration
- `islands/board.tsx`, `islands/controls-panel.tsx`, `islands/difficulty-badge.tsx`, `islands/editable-name.tsx`, `islands/editor-panel.tsx`, `islands/editor-toolbar.tsx`, `islands/share-button.tsx`, `islands/solution-dialog.tsx`, `islands/tutorial-dialog.tsx` — icon migration
- `routes/contribute.tsx`, `routes/index.tsx`, `routes/profile.tsx`, `routes/puzzles/index.tsx`, `routes/puzzles/[slug]/solutions/index.tsx`, `routes/puzzles/[slug]/solutions/[solutionId].tsx` — icon migration
- `routes/_app.tsx` — remove Phosphor link, remove Google Fonts links
- `styles.css` — add `@font-face` for Chakra Petch
- `static/fonts/` — add 3 Chakra Petch woff2 files
- `.claude/skills/frontend/ui-style.md` — update icon approach note
