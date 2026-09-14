# Project Vision — pbir-a11y

## Overview

`pbir-a11y` is a CLI translation of the [PBIX A11y](https://pbiaudits.com) browser
tool: the same accessibility rule engine (contrast, alt text, tab order, target
size, page/visual titles, clutter), pointed at a Power BI **PBIP/PBIR** project
folder on disk instead of a browser file-drop. It's for two audiences:

- A person running accessibility checks during development, in CI, or before
  handing a report to a client.
- An AI coding agent (Claude Code, GitHub Copilot, etc.) editing PBIR report
  JSON directly, so it can self-check its own edits.

The repo also ships as a Claude Code plugin (`.claude-plugin/plugin.json` +
`skills/pbir-a11y/SKILL.md`) so an agent can pick these checks up automatically.

## Goals

- Read-only, accurate parity with the original PBIX A11y rule engine — same
  scores, same issues, for anything ported from `src/lib/`.
- PBIP/PBIR-first: work directly against a git-diffable project folder, not a
  compiled `.pbix` binary.
- Agent-friendly output: `--json` for machine parsing, `explain <category>` for
  looking up a rule without a project on hand, `why`/`fix` fields on every
  issue so an agent doesn't have to re-derive WCAG guidance.
- Pair cleanly with report-authoring tools/skills (`pbir.tools`,
  `powerbi-report-authoring`) in an author → check loop: the authoring tool
  makes a change, `pbir-a11y` checks it immediately.
- Human-friendly output too: a formatted `--docx` export for sharing findings
  with a client or stakeholder.
- Usable as a CI gate via `--fail-on` and meaningful exit codes (`0`/`1`/`2`).

## Non-Goals (Out of Scope)

- Not a report-authoring or editing tool. `pbir-a11y` never writes to PBIR/PBIX
  files — it only reports. Pair it with an authoring tool for the fix step.
- Not a PBIX (compiled binary) auditor today — that's a possible future
  secondary path (see Roadmap in `README.md`), not the primary target.
- Not a hosted/SaaS accessibility-checking product or service that competes
  with [PBIX A11y](https://pbiaudits.com) — the [PolyForm Shield 1.0.0
  license](./LICENSE) explicitly excludes this use.
- Not a scorer of alt-text *quality* (yet) — `altText` currently checks
  presence/absence only; content quality is a known gap (see
  `skills/pbir-a11y/SKILL.md`).
- Not an auditor of custom-visual internals — `customVisuals` is
  advisory-only (flags presence, doesn't score accessibility).

## Key Constraints

- Node.js ≥ 18, TypeScript with `strict: true`, CommonJS modules, no bundler.
- `src/lib/*` (the ported rule engine: `rulesEngine.ts`, `contrastUtils.ts`,
  `apca.ts`, `colourblindUtils.ts`, `contrastSuggest.ts`, `fontScaling.ts`,
  `clutterIndex.ts`, `customVisuals.ts`, `pbixParser.ts`, `pbirParser.ts`) is
  intentionally unchanged from the original PBIX A11y browser tool except for
  the documented `pbirParser.ts` split (see `README.md` → "What's ported vs.
  new"). Don't refactor this code opportunistically — faithfulness to the
  original rule engine is the point, not idiomatic-TypeScript purity.
- [PolyForm Shield 1.0.0](./LICENSE) license: personal/commercial internal use
  and contributions are fine; building a competing product/service on this
  code is not.
- No linter or formatter (`.eslintrc`, `.prettierrc`, `biome.json`, etc.) is
  configured yet — style is enforced by convention and review, not tooling.
- Tests run via Node's built-in `--test` runner, not Jest/Vitest.
- Runtime dependencies are intentionally minimal: `commander`, `docx`, `jszip`.

## Architectural Decisions

- `src/lib/` — the ported rule engine (see Key Constraints above).
- `src/io/` — bridges an on-disk PBIP folder to an in-memory `JSZip`
  (`loadFromFolder.ts`), so the rule engine can stay unaware of where its
  input came from.
- `src/commands/` — CLI command implementations (`check.ts`, `explain.ts`)
  that call into `src/lib/` and `src/io/`.
- `src/cli.ts` — the CLI entrypoint (Commander-based).
- `.claude-plugin/plugin.json` + `skills/pbir-a11y/SKILL.md` — the Claude Code
  plugin packaging. This is first-class, not an afterthought: the skill is
  what lets an agent self-invoke checks without being told to.

## User Experience Principles

- Agent-first ergonomics: concise, parseable output; every issue carries
  `why` and `fix` so an agent (or person) doesn't need to re-derive
  accessibility guidance; `explain` works without a project on hand.
- Human-friendly too: `--docx` produces a client-shareable report using the
  bundled house-style template, not a generic dump.
- Never silently truncate: `check` prints every issue with no pagination on
  its own side; prefer `--json`/`--docx` as the source of truth over eyeballing
  scrolled terminal output.

## Success Criteria

- For every ported rule, `pbir-a11y check` produces the same score and issues
  the original PBIX A11y browser tool would for the equivalent project.
- `check`'s exit codes (`0` clean, `1` issues at/above `--fail-on`, `2` error)
  make it usable as an unattended CI gate.
- An agent working in a PBIP project picks up and runs the right check from
  `skills/pbir-a11y/SKILL.md`'s description alone, without being told to.
