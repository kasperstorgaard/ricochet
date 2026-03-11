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
- Writes one `.ts` file per icon into `components/icons/` (e.g. `arrow-left.ts`)
- Regenerates `components/icons/index.ts` as a barrel re-exporting all icons
- Run once after install; re-run only when upgrading `@phosphor-icons/core`
- Available as `deno task update-icons`

**`components/icons.tsx`** — thin entry point:
- `Icon` component: accepts a path-data string + optional `className`, renders `<svg width="1em" height="1em" fill="currentColor" class="inline align-middle">` so icons scale with `text-*` classes
- Re-exports all icons via `export * from "#/components/icons/index.ts"`
- One import covers both: `import { Icon, ArrowLeft } from "#/components/icons.tsx"`

Individual icon files stay small (~200 bytes each), avoiding Babel's 500KB deoptimisation limit. Tree-shaking removes unused icons in production.

**Migration**: Replaced all `<i className="ph ph-name extra">` usages with `<Icon icon={ArrowLeft} className="extra" />` across 19 files (33 instances).

Remove the Phosphor `<link>` from `_app.tsx`.

### 2. Self-host Chakra Petch

Downloaded the latin-subset `.woff2` files (weights 300, 400, 500) from Google Fonts, served from `/static/fonts/`. Added `@font-face` declarations with `font-display: swap` in `styles.css`. Removed both `<link rel="preconnect">` and the `fonts.googleapis.com` stylesheet link from `_app.tsx`.

Added `<link rel="preload" as="font">` for weight 400 only (most-used weight; others load from cache after first visit).

## Files changed

- `deno.json` — added `@phosphor-icons/core` import + `update-icons` task
- `scripts/update-icons.ts` — codegen script
- `components/icons.tsx` — `Icon` component + barrel re-export
- `components/icons/` — 1512 generated icon files + `index.ts` barrel
- `components/header.tsx`, `components/pagination.tsx`, `components/puzzle-card.tsx`, `components/select.tsx` — icon migration
- `islands/board.tsx`, `islands/controls-panel.tsx`, `islands/difficulty-badge.tsx`, `islands/editable-name.tsx`, `islands/editor-panel.tsx`, `islands/editor-toolbar.tsx`, `islands/share-button.tsx`, `islands/solution-dialog.tsx`, `islands/tutorial-dialog.tsx` — icon migration
- `routes/contribute.tsx`, `routes/index.tsx`, `routes/profile.tsx`, `routes/puzzles/index.tsx`, `routes/puzzles/[slug]/solutions/index.tsx`, `routes/puzzles/[slug]/solutions/[solutionId].tsx` — icon migration
- `routes/_app.tsx` — remove Phosphor link, remove Google Fonts links, add font preload
- `styles.css` — add `@font-face` for Chakra Petch
- `static/fonts/` — Chakra Petch woff2 files (latin subset, weights 300/400/500)
