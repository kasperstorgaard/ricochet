# UI style

## Visual language

The core aesthetic is bold, retro-futuristic and playful in a classic gaming
console kind of way. It is split into dark and light themes, with the dark theme
being the one with the most diverse colors, the light one being a bit more
modest. The font is "Chakra Petch", which is a techno, futuristic loud font with
a lot of sharp angles (not rounded). This is used for both headlines,
interactive elements and body text (limited). Additionally, there are some
supporting uses of monospace font "Dank Mono".

## Icons

The icon library is phosphor icons, and is being used as an icon pack for better
server side support (npm package is slightly client sided) They scale with text
size, and there are no conventions on size, stick to the same design system
tokens as text. Convention is to always have an icon for a button, never for a
link (links can be styled as buttons, in that case yes).

## Interactive elements

Buttons can have a size variant, but there are no primary secondary buttons.
<a> tags can be styled as buttons using .btn className.

## Layout & spacing

There are 3 main layout components, controlled by a global grid in
routes/_app.tsx

- Main: the main container for each page with potential to tweak the layout
  slightly
  - Header: current page and breadcrumb
  - Panel: secondary content, fx. ControlsPanel for the main
    puzzles/[slug]/index.tsx page
- Everything else -> modals, print

On mobile the primary content is on top, and the panel sits below it,
encouraging scroll if a page is longer (not sticky, don't overcomplicate it). On
desktop the primary content has max width, with auto margins, with the panel
given a fixed width on the right side.

There is no footer, the Panel serves this role.
