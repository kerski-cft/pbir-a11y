# pbir-a11y — Agent Instructions

## Vision Document

Before starting any non-trivial task (a new feature, a refactor, a change to
`src/lib/*`, license/packaging changes), read [`vision.md`](./vision.md) in
the project root. It's the source of truth for this project's goals,
non-goals, constraints, and success criteria.

If a requested task conflicts with `vision.md` (e.g. it would turn this into
a hosted/SaaS product, rewrite the ported rule engine in `src/lib/`, or add a
report-authoring/editing feature), stop, explain the specific conflict, and
ask the user how to resolve it before proceeding. Never proceed on an
assumption that overrides the vision document.

## TypeScript/JavaScript Conventions

@ai/typescript-guide.md

## Related, Already-Existing Artifacts

Don't duplicate these — they already cover their own scope:

- [`skills/pbir-a11y/SKILL.md`](./skills/pbir-a11y/SKILL.md) — the shipped
  Claude Code plugin skill for *consumers* of this tool (accessibility-check
  workflow guidance). Project-vision and TypeScript-convention guidance in
  this file is for people developing `pbir-a11y` itself, not for that skill.
- [`examples/CLAUDE.md`](./examples/CLAUDE.md) — an example `CLAUDE.md` block
  for *consumers'* PBIP report projects (accessible-by-default authoring
  loop), not for this repo.
