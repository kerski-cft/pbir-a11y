---
name: pbir-a11y
description: "Use this skill whenever creating, editing, or reviewing a Power BI PBIP/PBIR project's report definition — files under a `*.Report/definition/` folder, including `report.json`, `pages/*/page.json`, and `pages/*/visuals/*/visual.json`. Trigger after adding or modifying a visual, page, or theme in a PBIP project, or when the user asks about Power BI accessibility, WCAG compliance, alt text, contrast, tab order, or target size for a report. Also trigger when the user mentions 'pbir-a11y', 'accessibility check', or 'a11y' in the context of a Power BI project. Run the check after edits, not just when explicitly asked — accessibility issues introduced during editing (missing alt text on a new visual, a title toggled off, a duplicate tab order) are cheapest to catch immediately. Do NOT use this for general PBIR editing, formatting, or publishing — use pbir.tools or the Power BI agentic development skills for that; this skill only checks accessibility, it does not modify report files."
---

# Power BI PBIR accessibility checks

`pbir-a11y` is a CLI that runs the same rule engine as the [PBIX A11y](https://pbiaudits.com) browser tool against a PBIP project folder on disk. It is read-only: it reports issues, it does not modify the project. Pair it with `pbir.tools` (or equivalent) for making the actual edits.

## When to run it

- After adding a new visual, page, or changing a report theme
- After toggling a title, alt text field, or tab order value
- Before telling the user a report is "done" or "ready to publish"
- Whenever the user asks a Power BI accessibility question — run a check first rather than answering from general WCAG knowledge, since the actual issues in *their* report are more useful than generic advice

## Workflow

1. Locate the PBIP project root (contains a `.pbip` file) or the `*.Report` folder directly. If unsure, look for a `*.Report` folder in the current working directory or ask the user for the path.
2. Run the check with JSON output so you can parse it:
   ```bash
   pbir-a11y check <path> --json
   ```
3. Parse `summary.overallScore`, `summary.issueCount`, and each page's `issues` (page-level: titles, tab order, clutter) and `visuals[].issues` (visual-level: alt text, contrast, visual/axis titles, font size, target size).
4. For each issue, the JSON already includes `why` (rationale) and `fix` (what to change) — use these directly rather than re-deriving accessibility guidance yourself.
5. If you can make the fix (e.g. you're already editing that visual's JSON), apply it and re-run the check to confirm it's resolved. If you can't determine the right fix (e.g. what alt text to write), surface the issue and its `fix` text to the user instead of guessing content.
6. Report results concisely: score, count by severity, and the specific issues — not a restatement of every WCAG criterion involved.

## Useful flags

- `--category <name>` — scope to one check (`contrast`, `altText`, `clutter`, `pageTitles`, `visualTitles`, `axisTitles`, `fontScaling`, `tabOrder`, `targetSize`, `customVisuals`) when you only touched one aspect of the report
- `--page <name>` — scope to the page you just edited, to avoid re-reporting pre-existing issues elsewhere in the project as if they were new
- `--fail-on warn` — treat warnings as blocking too (default only fails on `fail`-severity issues), useful before a publish step
- Exit code: `0` clean, `1` issues found at or above `--fail-on` threshold, `2` couldn't read the project (bad path, unsupported format)

## Looking up a rule without running a check

```bash
pbir-a11y explain <category>   # e.g. pbir-a11y explain tabOrder
pbir-a11y explain              # lists all categories
```
Use this when the user asks "why does X matter" or you need the WCAG reference for something, without needing a project on hand.

## What this skill does not do

- Does not edit PBIR/PBIX files — it only reports
- Does not audit PBIX (compiled binary) files yet — PBIP/PBIR projects only
- Does not check custom visual internals — `customVisuals` is advisory-only, flagging that a custom visual is present, not scoring its accessibility
