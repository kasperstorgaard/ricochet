# Analytics

## PostHog usage

We use posthog as the product analytics and feature flag tool. It provides
custom event tracking, and can be used without logged-in users (although with
degraded usefulness) Broad tracking ala replay sessions, element clicks etc. can
be handled by posthog basic setup, to support whatever features posthog has

## What's already covered / built in to posthog

- pageviews (client side)
- session replays (client side)

## What's worth tracking

Any user-triggered event that is can be directly used to measure engagement
and/or can signal a trend in growth / community. Each event must be meaningful
on its own, but it is ok if some are mainlyu used sequentially for fx. funnel
analysis.

## Event naming

We use camel_case, with {subject}_{action past tense}, fx. hint_requested. This
is then re-framed to Capital Case in posthog ui (out of scope, but can be used
for documentation)

## What not to track

- generic events fx. "link_clicked", let posthog standard implementation handle
  this, if needed at all.
- very specific events fx. "daily_puzzle_hint_requested", let that be a
  combination of events in posthog
- onload events. ala solutions_page_viewed, use pageviews with filtering for
  this

## Cookie setup

We use a custom cookie banner and cookie page. If a user does not accept
cookies, they will be hashed by posthog for anonymous tracking of fx. pageviews.
This is a super cautious and compliant setup, in that we are not dealing with
any sensitive data, and still take an opt-in approach.
