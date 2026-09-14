# pbir-a11y Project Plan

This is the living list of current priorities and next steps that `/plan`
reviews — see [`vision.md`](./vision.md) for the fixed goals/constraints this
plan should stay aligned with.

## Current Priorities

### 📋 `pbir-a11y fix`

**Status**: 📋 IDEA
**Goal**: Auto-correct deterministic issues (bump undersized targets, reorder
duplicate tab indices) the way `pbir.tools set -f` does for general
formatting — a natural next step now that `check` is stable.

### 📋 `pbir-a11y watch`

**Status**: 📋 IDEA
**Goal**: Re-run checks on file save during active development, for a tighter
author → check loop without re-invoking the CLI manually each time.

### 📋 PBIX support in `src/io/`

**Status**: 📋 IDEA
**Goal**: Reuse the already-ported, untouched `pbixParser.ts` to audit
shipped `.pbix` files as a secondary path, without disturbing the
PBIP/PBIR-first primary workflow (see `vision.md` Non-Goals).

### 📋 Alt-text quality scoring

**Status**: 📋 IDEA
**Goal**: `altText` currently only checks presence/absence (known gap, see
`skills/pbir-a11y/SKILL.md`). Explore whether content-quality heuristics
belong in the automated check or stay guidance-only for agents fixing issues.

### 📋 File-size guideline tooling

**Status**: 📋 IDEA
**Goal**: `vision.md` now asks new/non-ported `.ts` files to stay ~500-800
lines. Today that's convention-only; add a lightweight check (a script, or
extend `npx aidd churn`'s output) that flags new/non-`src/lib` files over
800 lines so the guideline doesn't silently erode as the repo grows.

---

_Add new items here as they're identified (`/discover` can help turn a rough
idea into a scoped entry); move an item to "Done" with a one-line outcome
note once it ships, rather than deleting it._

## Done

- **Lint gate for new TypeScript** (2026-09-14): ESLint +
  `typescript-eslint` recommended rules via `npm run lint`, scoped to
  new/non-ported code (`src/lib/*` exempt); fixed the one pre-existing
  violation in `check.ts`. See
  [`tasks/archive/2026-09-14-lint-gate-for-new-typescript.md`](./tasks/archive/2026-09-14-lint-gate-for-new-typescript.md).
- **Full rule-check test coverage + coverage report** (2026-09-14): all 9
  automated `rulesEngine.ts` categories (plus `colourblind` at the
  `colourblindUtils.ts` level, since `analyze()` never emits it) now have
  both a flagged and a compliant/false-positive-guard test; added
  `npm run coverage` (Node's built-in `--experimental-test-coverage`,
  scoped to `src/lib/**`, 60% line gate — actual coverage rose from
  64.48% to 77.44%). See
  [`tasks/archive/2026-09-14-full-rule-check-test-coverage.md`](./tasks/archive/2026-09-14-full-rule-check-test-coverage.md).
