# File-Size Guideline Tooling Epic

**Status**: ✅ COMPLETED (2026-09-14)
**Goal**: Catch new/non-ported TypeScript files that quietly grow past
`vision.md`'s ~500-800 line guideline before they erode readability and
agent-context token efficiency.

## Overview

Nothing today enforces `vision.md`'s file-size guideline — it's
convention-only, so it can silently erode as the repo grows. Since
`eslint.config.js` (from the lint-gate epic) already scopes to exactly the
right files (new/non-ported code; `src/lib/**` stays exempt), this closes
the gap with a single rule addition rather than new tooling: ESLint's
built-in `max-lines` rule, no new dependency, enforced by the `npm run
lint` that already exists. Scoped per discovery (2026-09-14): a single
hard threshold at 800 lines (vision.md's "500-800 is the acceptable
range" reads as "exceeding it means going over 800"), not a two-tier
warn/error split.

---

## Add max-lines to eslint.config.js

Add ESLint's core `max-lines` rule (`max: 800, skipBlankLines: true,
skipComments: true`) to the existing scoped rule block in
`eslint.config.js`.

**Requirements**:
- Given a new/non-ported `.ts` file with more than 800 non-blank,
  non-comment lines, `npm run lint` should report a `max-lines` error and
  exit non-zero
- Given `src/lib/**`, should remain exempt regardless of length (already
  true via the existing `ignores`)
- Given the codebase as it exists today, `npm run lint` should continue
  to pass cleanly with no new violations

---
