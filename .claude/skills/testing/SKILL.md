---
name: testing
description: Testing philosophy — what to test, realistic scenarios, what not to bother with
---

# Testing approach

## What to test

The game logic is the soul of the app, and is relatively easy to reason about
and test. It should be 100% covered, and using realistic scenarios that can end
up catching refactor bugs. vs dummy code that only tests one specific util case.

## What to skip

Client side hooks etc. are not a priority to test, as they are supportive. 3rd
party wrappers are not a priority, as they end up testing very little in
practice.

## Assertion style

Single deep equality, one scenario per test.

## Test file conventions

*_test.ts naming, co-location with the module under test, all taken from
Deno.test() patterns
