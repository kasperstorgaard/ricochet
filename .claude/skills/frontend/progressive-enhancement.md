# Progressive enhancement

## Core principle

Progressive enhancement is a core philosophy, and brings a number of benefits:
Server side browser technology, html, cookies, headers, css, is developed by a
large community of very smart people, and battle tested by millions of users. It
brings paths for adoption and fallbacks, and it forces the developer to think
about a wider set of use cases and to justify custom solutions when a simpler
and native solution is available.

URL-first architecture follows naturally from PE — see architecture/state.md.

## Islands architecture (Fresh 2)

Fresh implements PE through islands: `components/` is server-rendered only, `islands/`
is hydrated client-side. The rule is simple — put interactivity in islands, layout and
markup in components. Default to `components/`; only reach for an island when the UI
genuinely needs client-side behaviour. One exception: the editor is inherently
client-side and can rely on it fully.

## HTML forms

Forms are complex and almost unavoidable in modern frontend. Luckily, they work
100% server side and cover a wide variety of validation by default.

## Accessibility

Semantic html is a good way of forcing yourself to think about the purpose of a
bigger piece of ui or even the atomic parts, fx. the kbd element. They bring
excellent a11y out of the box and a multitude of properties.

When semantic html is not enough, aria can be used to complement. Caveat: if you
are building a very complex aria component, ask yourself if that component
should be built at all, not how to solve it with aria.

Sidenote: try and make as much of the interface keyboard navigateable as
possible. It brings good semantics / mental model when it works, and it ends up
helping more people than you think.

## "Use the platform"

Use <select> over radix js components, it gives you the possibility for custom
style when not interacted with, and a native UI when interacted with on mobile.
Use animations and transitions of transforms, not animation javascript, it is
faster.
