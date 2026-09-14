# Lint Gate for New TypeScript Epic

**Status**: ✅ COMPLETED (2026-09-14)
**Goal**: Catch style and bug-prone patterns in new/non-ported TypeScript
via a configured linter instead of relying on manual review alone.

## Overview

Without a configured linter, style and bug-prone patterns (unused vars,
floating promises, etc.) are caught only by manual review, if at all,
which slows reviews and lets real bugs through; this epic closes that gap
for new/non-ported code (`src/commands/`, `src/io/`, `src/cli.ts`,
`test-files/`) while leaving the intentionally-unchanged `src/lib/*`
ported engine untouched, per `vision.md`. Scoped per discovery
(2026-09-14): an `npm run lint` script only (no CI workflow or git hook
yet), the `typescript-eslint` "recommended" rule set, lint-only (no
Prettier/formatter).

---

## Add ESLint + typescript-eslint config

Add `eslint` and `typescript-eslint` as devDependencies with a flat
`eslint.config.js` applying the `recommended` rule set.

**Requirements**:
- Given `eslint.config.js`, should apply typescript-eslint's recommended
  rules to `src/commands/**`, `src/io/**`, `src/cli.ts`, and
  `test-files/**`
- Given `src/lib/**`, should be excluded entirely from linting (ported
  engine carve-out)
- Given `dist/**` (build output), should be excluded from linting

---

## Wire up npm run lint script

Add an `npm run lint` script to `package.json` that runs ESLint over the
scoped paths.

**Requirements**:
- Given no violations in scope, `npm run lint` should exit 0
- Given a recommended-rule violation in scope, `npm run lint` should
  exit non-zero and print the file and line

---

## Fix existing violations in non-ported code

Run the new lint script against the current codebase and fix whatever it
flags in `src/commands/`, `src/io/`, `src/cli.ts`, and `test-files/`.

**Requirements**:
- Given the codebase as it exists today, should have zero ESLint errors
  in `src/commands/`, `src/io/`, `src/cli.ts`, and `test-files/` after
  fixes
- Given any fix applied, `npm test` should still pass — no change to
  externally observable CLI behavior

---
