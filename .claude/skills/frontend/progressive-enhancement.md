# Progressive enhancement

alias: PE

## Core principle

Progressive enhancement is a core philosophy, and brings a number of benefits:
Server side browser technology, html, cookies, headers, css, is developed by a
large community of very smart people, and battle tested by millions of users. It
brings paths for adoption and fallbacks, and it forces the developer to think
about a wider set of use cases and to justify custom solutions when a simpler
and native solution is available.

## URL as architecture

Using the url as the architectural foundation of an app brings some benefits:

- it anchors and scopes functionality
- gives a meaningful place to store temporary/less important state
- provides a pattern of "meaningful action" -> "go to target url pattern"

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
