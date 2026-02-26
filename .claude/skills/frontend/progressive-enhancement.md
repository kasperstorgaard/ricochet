# Progressive enhancement

## Core principle

Progressive enhancement is a core philosophy. Browser-native technology (HTML,
CSS, cookies, headers) is battle-tested by millions of users and developed by
large, smart communities. It forces you to think about a wider set of use cases
and justify custom solutions when a simpler native one exists.

URL-first architecture follows naturally from PE — see architecture/state.md.

## Islands architecture (Fresh 2)

Fresh implements PE through islands: `components/` is server-rendered only,
`islands/` is hydrated client-side. The rule is simple — put interactivity in
islands, layout and markup in components. Default to `components/`; only reach
for an island when the UI genuinely needs client-side behaviour. One exception:
the editor is inherently client-side and can rely on it fully.

## HTML forms

Forms are complex and almost unavoidable in modern frontend. Luckily, they work
100% server side and cover a wide variety of validation by default.

## Accessibility

Semantic html is a good way of forcing yourself to think about the purpose of a
bigger piece of ui or even the atomic parts, fx. the kbd element. They bring
excellent a11y out of the box and a multitude of properties.

When semantic HTML isn't enough, ARIA can complement it. Caveat: if an ARIA
component is getting very complex, ask whether it should exist at all — not how
to make it work with ARIA.

Make as much of the interface keyboard-navigable as possible. It enforces good
semantics and ends up helping more users than you'd expect.

## "Use the platform"

Use `<select>` over JS component libraries — it allows custom styling at rest
and falls back to native UI on mobile. Use CSS transforms for animation, not JS
— it's faster and compositor-accelerated.
