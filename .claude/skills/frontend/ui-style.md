# UI style

## Visual language

The core aesthetic is bold, retro-futuristic, and playful — like a classic
gaming console. Dark and light themes both exist; dark has the richer colour
palette, light is more restrained. The primary font is "Chakra Petch": techno,
sharp-angled, used for headlines, interactive elements, and sparingly for body
text.

## Icons

Icons use the Phosphor icon pack (better server-side support than the npm
package). They scale with text size — use the same design tokens as text, no
special size conventions. Always use an icon for a button, never for a plain
link (links styled as buttons are fine).

## Interactive elements

Buttons can have a size variant, but there are no primary secondary buttons.
<a> tags can be styled as buttons using .btn className.

## Layout & spacing

Three main layout components, controlled by a global grid in `routes/_app.tsx`:

- **Main** — the primary page container
  - **Header** — current page and breadcrumb
  - **Panel** — secondary content (e.g. `ControlsPanel` on the puzzle page)
- Everything else — modals, print

On mobile, primary content is on top and the panel sits below, leading to a
sometimes long scrollable page (not sticky). On desktop, primary content has a
max-width with auto margins; the panel sits at a fixed width on the right.

There is no footer, the Panel serves this role.
