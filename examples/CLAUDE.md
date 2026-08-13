# Example: accessible-by-default Power BI authoring

Copy one of the blocks below into the `CLAUDE.md` at the root of your PBIP
project (next to the `.pbip` file) if you want accessibility checks to run
as part of every edit, not just when you remember to ask for one. Use the
generic version if you're pairing `pbir-a11y` with `pbir.tools` or another
single authoring tool; use the Fabric version if you're using Microsoft's
`powerbi-report-design` + `powerbi-report-authoring` skills from Skills for
Fabric.

`pbir-a11y` itself must be installed and on `PATH` either way (see this
repo's README).

---

## Generic version (single authoring tool)

Assumes an authoring tool/skill installed (e.g. `pbir.tools`, or a Power BI
agentic-development plugin) for actually creating/editing report JSON.

```markdown
## Accessibility workflow for this project

After adding or editing any visual, page, or theme:

1. Run a scoped check on what just changed:
   pbir-a11y check . --page <name> --json
   (use --category <name> instead if the edit only touched one aspect,
   e.g. `contrast` after a theme change)
2. Fix any mechanical issue directly using the authoring tool — contrast
   ratio, missing page/visual/axis titles, tab order, target size, font
   scaling — then re-run the check to confirm it's resolved.
3. For anything needing judgment (what alt text should say, a deliberate
   design choice), ask me rather than guessing content.
4. Before telling me a report is "done" or ready to publish, run a full
   pass with a stricter gate:
   pbir-a11y check . --fail-on warn --json
```

---

## Fabric version (Report Design + Report Authoring skills)

Assumes the `powerbi-report-design` and `powerbi-report-authoring` skills
from the [Skills for Fabric](https://github.com/microsoft/skills-for-fabric)
`powerbi-authoring` plugin are installed, alongside `pbir-a11y`.

```markdown
## Accessibility workflow for this project

This project uses the Design → Authoring → Check pipeline:

1. powerbi-report-design produces the design brief (archetype, layout,
   color, chart selection, and its own accessibility guidance). Treat
   that guidance as intent, not confirmation — nothing has been checked
   against real files yet at this stage.
2. powerbi-report-authoring writes the PBIR files (pages, visuals, theme)
   from the brief.
3. Immediately after any authoring step writes or changes files, run:
   pbir-a11y check . --page <name> --json
   (use --category <name> instead if the step only touched one aspect,
   e.g. `contrast` after a theme registration)
4. If pbir-a11y flags something the brief called for but the authoring
   step didn't fully implement (e.g. a contrast ratio that drifted, a
   missing alt text field, a duplicate tab index), send it back to
   powerbi-report-authoring to fix, then re-run the check to confirm.
5. For anything needing judgment that neither skill can resolve on its
   own (what alt text should actually say, a deliberate design
   trade-off), ask me rather than guessing content.
6. Before telling me a report is "done" or ready to publish, run a full
   pass with a stricter gate:
   pbir-a11y check . --fail-on warn --json

Do not treat step 1's accessibility guidance as sufficient on its own —
step 3 is what confirms it actually made it into the files.
```

---

## Why this file exists

`pbir-a11y`'s own skill description already tells an agent to check after
edits rather than waiting to be asked, and to treat any active authoring
tool — Fabric skills included — as part of that loop. This file is for
making that explicit and durable at the project level too, useful if:

- you want the exact loop spelled out rather than relying on the skill
  being loaded and interpreted the same way every session
- you're using a different agent/tool than the one the skill targets
- you want to tune the loop for your project (e.g. always use
  `--fail-on warn`, or scope to a subset of categories your team cares
  about most)

Nothing here modifies report files by itself — `pbir-a11y` stays
read-only. The actual edits still come from whichever authoring
tool/skill you pair it with.
