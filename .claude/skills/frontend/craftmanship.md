# Craftmanship

## Separation of concerns

Always keep implementation free of consumer related concerns when possible. For
styles: No grid placement, align-self, position absolute on child components,
even if situational, pass these in through className. For client side logic: no
complex inner logic, prefer handlers passed in props.
