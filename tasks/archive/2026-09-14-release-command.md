# Release Command Epic

**Status**: ✅ COMPLETED (2026-09-14)
**Goal**: Give `pbir-a11y` a `/release` command that proposes a version
bump — inferred from conventional-commit types since the last release —
instead of the ad hoc manual `package.json` edits the repo has used so
far.

## Overview

Versioning today is a manual `package.json` edit with no process
(confirmed via `git log`: only one prior "Bump version to 0.2.0" commit
in the repo's whole history) — exactly how the CLI's `--version` bug
happened (a hardcoded string never updated as the real version advanced).
Classifying commits and computing a semver bump is fully deterministic,
so that logic lives in scripts, not free-form reasoning; the
`aidd-release` skill's job is to run them, present the proposal, and take
confirmation before anything is applied. Scoped per discovery
(2026-09-14): a new dedicated `/release` command, bump level inferred
from conventional-commit types with confirmation before applying, and
git tags introduced starting with this process (the repo has none today).

---

## Write scripts/propose-release.js

Finds the last version-bump commit (by diffing `package.json`'s
`version` field across its commit history — no git tags exist to anchor
on), classifies every commit since then by conventional-commit type, and
computes the proposed bump level and next version. Read-only.

**Requirements**:
- Given `package.json`'s commit history, should find the most recent
  commit where the `version` field actually changed, not just any commit
  that touched the file
- Given commits since that bump, should classify each by conventional-commit
  type (feat/fix/chore/docs/refactor/test/perf/build/ci/style/revert/other)
  and detect a `!` after type/scope or a `BREAKING CHANGE:` footer
- Given the classified commits, should propose: any breaking marker →
  major, else any `feat` → minor, else any `fix` → patch, else no bump
- Given no release-worthy commits, should say so rather than proposing a
  version

---

## Write scripts/apply-release.js

Given an explicit, already-confirmed version string as an argument
(never re-derived), updates `package.json`, commits that change, and
creates an annotated git tag.

**Requirements**:
- Given a version argument, should update only `package.json`'s
  `version` field, commit with a conventional `chore(release):` message,
  and create an annotated tag (e.g. `v0.4.0`) pointing at that commit
- Given `--dry-run`, should print what it would do without changing
  anything
- Should never push the commit or tag

---

## Author the aidd-release skill

Write `.claude/skills/aidd-release/SKILL.md` and `README.md` per the
`aidd-upskill` conventions (frontmatter, a `## Process` section wiring
the two scripts together with the confirmation step, `Constraints`).

**Requirements**:
- Given the skill is activated, should run `propose-release.js`, present
  the proposal, and only call `apply-release.js` after explicit user
  confirmation of the exact version
- Given the user overrides the proposed level, should apply the
  override, not the script's default

---

## Add the /release command and document it

Add `.claude/commands/release.md` (thin entry delegating to the skill,
matching the `/log` pattern) and add `/release` to `CLAUDE.md`'s
Workflow Commands list.

**Requirements**:
- Given `/release`, should behave identically to invoking the
  `aidd-release` skill directly
- Given `CLAUDE.md`'s command list, should describe `/release` at the
  same level of detail as the other entries there

---

## End-to-end dry run against real history

Run the full flow against this repo's actual commits since the "Bump
version to 0.2.0" commit, without applying anything.

**Requirements**:
- Given the real commit history, the proposed bump level and next
  version should be sensible given the mix of `feat`/`fix`/`test`/`chore`
  commits made this session

---
