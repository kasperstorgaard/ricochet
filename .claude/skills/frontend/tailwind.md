# Tailwind, design tokens, components & CSS

## Tailwind

- Prefer utility classes per element over global utils. Exception: native-like
  components like `.icon-btn` where wrapping in a component just bloats.
- Break long class strings across multiple lines with `clsx`.
- Media queries (`size`, `print`, etc.) each get their own line.
- Order: positioning and sizing first, "look" last (text, border, bg, etc.).

## clsx

- Use for conditionals: prefer `isSomething && "hidden"` over object syntax.
- Never extract classes into consts — extract a local component instead if
  duplication gets heavy.

## Design tokens

The basic design system tokens are from open props, read them if needed:
node_modules/open-props/open-props.min.css
node_modules/open-props/normalize.min.css

They are then customised and extended in the tailwind styles.css config

## CSS

Don't touch styles.css unless specifically fixing a global style bug or
extending the design system tokens. If you feel like a new global component
class is warranted, ask for confirmation.
