# Spec: Spec-to-PR workflow

## Context

Plans written during development had no canonical home — they lived in chat
context and were lost after the session. PRs often had minimal descriptions,
making review harder.

## Plan

### `CLAUDE.md` — planning convention

Document that plans should be written to `spec.md` at the project root and
committed. The file lives in the branch for context during review, then is
deleted in a cleanup commit before merging.

### `.github/PULL_REQUEST_TEMPLATE.md` — placeholder template

Add a PR template with a `<!-- spec: ... -->` placeholder comment explaining
what will happen. Also includes a `## Demo` section for screenshots.

### `.github/workflows/spec-to-pr.yml` — auto-populate PR body

On PR open, if `spec.md` exists, replace the `<!-- spec -->` placeholder in
the PR body with the contents of `spec.md` using `sed`. Skip if the placeholder
has been manually removed. Gated at the job level with `hashFiles('spec.md')`.

### `.github/workflows/check-spec.yml` — block merge if spec.md remains

Fail PRs targeting `main` if `spec.md` still exists, enforcing the cleanup
step before merge.

### `deno.json` — exclude spec.md from formatter

Add `spec.md` to `fmt.exclude` so Deno's formatter doesn't rewrite it.
