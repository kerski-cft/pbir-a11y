[![License](https://img.shields.io/badge/license-PolyForm--Noncommercial--1.0.0-blue)](./LICENSE) [![Power BI](https://img.shields.io/badge/Power_BI-F2C811?logo=powerbi&logoColor=000)](https://powerbi.microsoft.com) [![Node](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)](https://nodejs.org) [![Claude Code Compatible](https://img.shields.io/badge/Claude_Code-compatible-D97757?logo=claude&logoColor=fff)](https://code.claude.com)

# PBIR A11y CLI

`pbir-a11y` (accessibility checks for Power BI **PBIP/PBIR** projects) for use by a person
during development, or by an AI coding agent (Claude Code, Copilot, etc.)
editing report JSON directly. Same idea as
[pbir.tools](https://github.com/maxanatsko/pbir.tools), but for accessibility
checks instead of general report editing.

This is a CLI translation of the [PBIX A11y](https://pbiaudits.com) browser
tool: same rule engine, same checks, pointed at a project folder on disk
instead of a browser file-drop.

## Use as a Claude Code skill

The repo is also a valid Claude Code plugin (`.claude-plugin/plugin.json` +
`skills/pbir-a11y/SKILL.md`), so an agent editing a PBIP project can pick up
these checks automatically instead of needing to be told to run them.

**Install as a plugin** (mirrors how `pbir.tools` distributes its own
marketplace plugin):

```bash
claude plugin marketplace add <your-github-username>/pbir-a11y
claude plugin install pbir-a11y@pbir-a11y
```

**Or install the skill directly**, without the plugin system: copy the
skill folder into your project or user scope:

```bash
# Project scope (shared with your team via version control)
cp -r skills/pbir-a11y .claude/skills/pbir-a11y

# User scope (available in every project)
cp -r skills/pbir-a11y ~/.claude/skills/pbir-a11y
```

Either way, the CLI itself (`pbir-a11y`) still needs to be installed and on
`PATH` (see Install, below); the skill just tells the agent when and how to
call it.

> **Note on the marketplace install path:** this repo includes
> `.claude-plugin/plugin.json` and `skills/pbir-a11y/SKILL.md`, which is
> Anthropic's documented, required structure for a plugin. It does **not**
> include a `marketplace.json`; the exact schema for self-hosting a
> single-plugin repo as its own marketplace source wasn't something I could
> verify with full confidence when this was put together, so it was left
> out rather than guessed at. If `claude plugin marketplace add
> <username>/pbir-a11y` doesn't pick the repo up as-is, check the current
> schema at `code.claude.com/docs/en/plugin-marketplaces` before assuming
> the plugin itself is broken; the project-scope/user-scope copy method
> above doesn't depend on this and is confirmed to work.

## Why PBIP, not PBIX

A `.pbix` is a compiled binary; nobody hand-edits it, so it doesn't fit a
dev-time, agent-in-the-loop workflow. A PBIP project (`MyReport.pbip` plus
`MyReport.Report/` plus `MyReport.SemanticModel/`) is a plain, git-diffable
folder tree, and PBIR is the report-definition format inside the `.Report`
folder (`definition/pages/<page>/visuals/<id>/visual.json`). That's what
this CLI reads directly: no zipping, no upload step.

PBIX audit support may come back later as a secondary "check a shipped file"
path, but it's not the primary target.

## Install

```bash
npm install
npm run build
npm link   # optional: exposes `pbir-a11y` globally
```

## Usage

```bash
# Point at the PBIP project folder (auto-finds the *.Report subfolder)
pbir-a11y check ./MyReport

# Or point at the .Report folder directly
pbir-a11y check ./MyReport/MyReport.Report

# Only run one category of check
pbir-a11y check ./MyReport --category altText

# Only show one page
pbir-a11y check ./MyReport --page Overview

# Machine-readable output, for an agent to parse
pbir-a11y check ./MyReport --json

# Exit 0 unless something above "warn" is found (default: fail)
pbir-a11y check ./MyReport --fail-on warn

# What does a given check actually look for?
pbir-a11y explain tabOrder
pbir-a11y explain          # lists all categories
```

Exit code is `0` when nothing at or above `--fail-on` severity is found, `1`
when something is, and `2` on a genuine error (bad path, unreadable project).
That makes `check` usable as a CI gate or a pre-commit hook, not just a
manual report.

## What's ported vs. new

Everything under `src/lib/` is the existing PBIX A11y rule engine, copied
across unchanged except for one file:

| File | Status |
|---|---|
| `rulesEngine.ts`, `contrastUtils.ts`, `apca.ts`, `colourblindUtils.ts`, `contrastSuggest.ts`, `fontScaling.ts`, `clutterIndex.ts`, `customVisuals.ts`,
