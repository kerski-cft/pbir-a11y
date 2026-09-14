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

---

_Add new items here as they're identified (`/discover` can help turn a rough
idea into a scoped entry); move an item to "Done" with a one-line outcome
note once it ships, rather than deleting it._

## Done
