# PBIR A11y CLI

`pbir-a11y` — accessibility checks for Power BI **PBIP/PBIR** projects — for use by a person
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

**Or install the skill directly**, without the plugin system — copy the
skill folder into your project or user scope:

```bash
# Project scope (shared with your team via version control)
cp -r skills/pbir-a11y .claude/skills/pbir-a11y

# User scope (available in every project)
cp -r skills/pbir-a11y ~/.claude/skills/pbir-a11y
```

Either way, the CLI itself (`pbir-a11y`) still needs to be installed and on
`PATH` (see Install, above) — the skill just tells the agent when and how to
call it.

> **Note on the marketplace install path:** this repo includes
> `.claude-plugin/plugin.json` and `skills/pbir-a11y/SKILL.md`, which is
> Anthropic's documented, required structure for a plugin. It does **not**
> include a `marketplace.json` — the exact schema for self-hosting a
> single-plugin repo as its own marketplace source wasn't something I could
> verify with full confidence when this was put together, so it was left
> out rather than guessed at. If `claude plugin marketplace add
> <username>/pbir-a11y` doesn't pick the repo up as-is, check the current
> schema at `code.claude.com/docs/en/plugin-marketplaces` before assuming
> the plugin itself is broken — the project-scope/user-scope copy method
> above doesn't depend on this and is confirmed to work.

## Why PBIP, not PBIX

A `.pbix` is a compiled binary — nobody hand-edits it, so it doesn't fit a
dev-time, agent-in-the-loop workflow. A PBIP project (`MyReport.pbip` +
`MyReport.Report/` + `MyReport.SemanticModel/`) is a plain, git-diffable
folder tree, and PBIR is the report-definition format inside the `.Report`
folder (`definition/pages/<page>/visuals/<id>/visual.json`). That's what
this CLI reads directly — no zipping, no upload step.

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
| `rulesEngine.ts`, `contrastUtils.ts`, `apca.ts`, `colourblindUtils.ts`, `contrastSuggest.ts`, `fontScaling.ts`, `clutterIndex.ts`, `customVisuals.ts`, `pbixParser.ts` | **Unchanged.** Pure logic, no browser dependency. |
| `pbirParser.ts` | **Lightly refactored.** The original `parsePbir(file: File)` only ever loaded a zip via a browser file-drop. It's now split into `parsePbir(file: File)` (unchanged, still there for anything browser-based) and a new `parsePbirFromZip(zip, name, size)` that takes an already-built JSZip instance. `parsePbir` calls `parsePbirFromZip` internally — no rule logic changed, only where the zip gets built. |

Everything under `src/io/` and `src/commands/`, plus `src/cli.ts`, is new, as
are `.claude-plugin/plugin.json` and `skills/pbir-a11y/SKILL.md` (the agent
packaging):

- **`src/io/loadFromFolder.ts`** — walks a PBIP project folder on disk and
  builds an in-memory JSZip mirroring it, then hands that straight to
  `parsePbirFromZip`. This is what lets the CLI read a real folder instead
  of requiring a zip upload.
- **`src/commands/check.ts`** — runs `analyze()` against the loaded report,
  prints a human summary or `--json`, sets the process exit code.
- **`src/commands/explain.ts`** — static per-category documentation
  (what it checks, which WCAG criterion), independent of any report, so an
  agent can look up a rule without needing a project on hand.

The five original `.tsx` React components (`GuestAudit`, `Results`, etc.)
were not ported — they're browser UI for pbiaudits.com and have no
equivalent in a CLI; the CLI's `check` command replaces their role.

## Roadmap ideas

- `pbir-a11y fix` — auto-correct the deterministic issues (bump undersized
  targets, reorder duplicate tab indices) the way `pbir.tools set -f` does
  for general formatting.
- `pbir-a11y watch` — re-run checks on file save during active development.
- PBIX support in `src/io/` for auditing shipped files, reusing
  `pbixParser.ts` (already ported, untouched).

## License

[PolyForm Noncommercial License 1.0.0](./LICENSE) — free to use, modify,
and redistribute for any noncommercial purpose (personal, educational,
charitable, research, government). Commercial use — selling the software,
bundling it into a paid product or service, or offering paid consulting
built on it — is not permitted under this license. Get in touch for a
commercial license if you need one.
