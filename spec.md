# Spec: Spec-to-PR workflow

## Context

Plans written during development had no canonical home — they lived in chat
context and were lost after the session. PRs often had minimal descriptions,
making review harder.

## Plan

### `CLAUDE.md` — planning convention

Document that plans should be written to `spec.md` at the project root and
committed. The file lives in the branch for context during review, then is
archived and deleted before merging.

### `.github/pull_request_template.md` — placeholder template

Add a PR template with `<!-- spec:start -->` / `<!-- spec:end -->` markers
enclosing a human-readable comment explaining the auto-population. Also
includes a `## Demo` section for screenshots.

### `.github/workflows/spec-to-pr.yml` — auto-populate PR body

On PR open, reopen, or push, if `spec.md` exists, replace the content between
the spec markers in the PR body using `awk`. Skips if the markers have been
manually removed. Gated at the step level with `hashFiles('spec.md')`.

### `.github/workflows/check-spec.yml` — block merge if spec.md remains

Fail PRs targeting `main` if `spec.md` still exists, enforcing the cleanup
step before merge.

### `scripts/archive-spec.ts` + `deno task archive-spec`

Archive `spec.md` to `specs/<branch-slug>.md` before deleting it. Branch name
is slugified via `@annervisser/slug`.

### `.claudeignore`

Exclude `specs/` from Claude's context so past specs don't bloat every session.
Reference them explicitly when needed.

### `deno.json` — exclude spec.md from formatter

Add `spec.md` to `fmt.exclude` so Deno's formatter doesn't rewrite it.
