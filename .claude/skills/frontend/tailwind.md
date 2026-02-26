# Tailwind, design tokens, components & CSS

## Tailwind

Prefer tailwind classes on each html element over global utils. The exception is
native-like dumb global components like .icon-btn, where it just bloats if we
wrap it in a component. Classess should be broken into multiple lines when it
goes too long, use clsx for this. Media queries (size, print, etc.) should be on
their own lines (one for each size, type) Don't care much about sorting, but
positioning and sizing first, "look" last (text, border, bg, etc.)

clsx is used for conditionals, preferring the style of `isSomething && "hidden"`
over objects. classes should _never_ be extracted into consts - instead extract
into local components for heavy duplication.

## Design tokens

The basic design system tokens are from open props, read them if needed:
node_modules/open-props/open-props.min.css
node_modules/open-props/normalize.min.css

They are then customised and extended in the tailwind styles.css config

## CSS

Don't touch styles.css unless specifically fixing a global style bug or
extending the design system tokens. If you feel like a new global component
class is warranted, ask for confirmation.
