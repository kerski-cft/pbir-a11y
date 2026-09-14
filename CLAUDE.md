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

## Workflow Commands

Adapted from the [AIDD Framework](https://github.com/paralleldrive/aidd)
(MIT License), scoped down to what's actually installed in this repo. All
of them defer to the `aidd-please` skill for shared assistant constraints
(depth control, one-thing-at-a-time, don't edit files unless asked).

- `/help` — lists these commands.
- `/plan` — reviews [`plan.md`](./plan.md) (current priorities/next steps —
  distinct from the fixed `vision.md`) and suggests next steps.
- `/discover` — uses the `aidd-product-manager` skill to turn a rough idea
  into a scoped user journey/story/feature, saved under `plan/story-map/`.
- `/task`, `/execute` — the `aidd-task-creator` skill plans and executes
  epics (stored in `tasks/`), using the `aidd-tdd` skill's TDD process
  (adapted for this repo's `node --test`-based `npm test`) when implementing.
- `/aidd-fix` — the disciplined bug-fix loop (failing test → minimal fix →
  `/review` → `/commit`; never auto-pushes — see the `aidd-fix` skill).
- `/review` — the `aidd-review` skill, trimmed to the checks that apply here
  (TypeScript quality, test coverage, OWASP top 10, hotspot cross-reference,
  `vision.md` alignment) — upstream also references React/Redux/Lit/JWT
  skills that aren't installed.
- `/log` — the `aidd-log` skill appends completed epics to
  [`activity-log.md`](./activity-log.md).
- `/commit` — conventional-commit template. Never pushes automatically.
- `/aidd-churn` — the `aidd-churn` skill ranks files by hotspot score via
  `npx aidd churn` (the `aidd` npm package is a devDependency here
  specifically for this).
- `/user-test` — the `aidd-user-testing` skill, rewired from upstream's
  browser/screenshot testing to CLI-driven test scripts (scripted
  `pbir-a11y` invocations against fixture projects), since this repo has no
  UI. `/run-test` (execute in a real browser) was dropped for the same
  reason.
- `/aidd-upskill` — the `aidd-upskill` skill for authoring new
  `.claude/skills/aidd-*` skills for this repo.
- `aidd-agent-orchestrator` — routes a request to the right skill above; its
  `Agents{}` map is rescoped to this repo's actual skill set (upstream's
  routed to a NextJS/React/Redux/Shadcn stack this repo doesn't have).
- `/aidd-pipeline` — runs a markdown task list step-by-step via subagents.
- `/aidd-parallel` — generates `/aidd-fix` delegation prompts for a task list
  and dispatches them to subagents in dependency order on a shared branch.
- `/aidd-pr` — triages open PR review comments, resolves already-addressed
  threads, and delegates remaining ones as `/aidd-fix` prompts (needs `gh`
  authenticated).
- `aidd-requirements` — writes `Given $situation, should $jobToDo` functional
  requirements for a user story; complements `aidd-product-manager`.
- `/aidd-rtc` — Reflective Thought Composition: a structured
  restate→ideate→reflect→expand→score→respond thinking pipeline for
  decisions where reasoning quality matters more than response speed.
- `aidd-write` — prose writing/editing/scoring skill; useful for README,
  docs, and the client-facing `--docx` report copy.
- `aidd-timing-safe-compare` — security rule: hash-then-compare (SHA3-256)
  instead of raw/timing-safe comparison for any secret or token check.
- `aidd-sudolang-syntax` — cheat sheet for the SudoLang pseudocode syntax
  these skill files are written in; reference only, not a command.

Deliberately not installed: domain skills for React/Redux/Lit/ECS/JWT/
Observe/NextJS-stack/etc. (not applicable to this Node CLI — no UI, no
Adobe `@adobe/data` stack, no auth), `aidd-structure`/`aidd-namespace`
(their layered components/plugins/services/types architecture is the same
Adobe-stack pattern, not this repo's actual `src/lib`/`src/io`/`src/commands`
layout — see `vision.md` → Architectural Decisions), `aidd-error-causes`
(would require adding the `error-causes` runtime dependency, conflicting
with `vision.md`'s minimal-dependency constraint), and `/aidd-riteway-ai`
(would need the separate `riteway` CLI; this repo tests with `node --test`
instead). See `vision.md` before assuming a command exists beyond this list.

## Related, Already-Existing Artifacts

Don't duplicate these — they already cover their own scope:

- [`skills/pbir-a11y/SKILL.md`](./skills/pbir-a11y/SKILL.md) — the shipped
  Claude Code plugin skill for *consumers* of this tool (accessibility-check
  workflow guidance). Project-vision and TypeScript-convention guidance in
  this file is for people developing `pbir-a11y` itself, not for that skill.
- [`examples/CLAUDE.md`](./examples/CLAUDE.md) — an example `CLAUDE.md` block
  for *consumers'* PBIP report projects (accessible-by-default authoring
  loop), not for this repo.
