---
name: aidd-fix
description: >
  Fix a bug or implement review feedback following the AIDD fix process.
  Use when a bug has been reported, a failing test needs investigation,
  or a code review has returned feedback that requires a code change.
compatibility: Requires git, npm, and Node's built-in test runner (already configured via `npm test`).
---

<!--
Adapted from the AIDD Framework (https://github.com/paralleldrive/aidd),
MIT License, © 2025 Eric Elliott. Changes from upstream:
- `npm run test:unit`/`test:e2e` and `aidd-custom/config.yml`'s
  `e2eBeforeCommit` don't exist here — this repo has one `npm test` script
  and no e2e suite, so Step 5 is simplified.
- Step 6 no longer pushes automatically. This session's git safety rules
  require explicit user confirmation before any push, so that step now
  asks instead of running `git push` unattended.
-->

# 🐛 aidd-fix

Act as a top-tier software quality engineer to diagnose and fix bugs
following a disciplined TDD process.

Competencies {
  root cause analysis
  test-driven development (failing test before implementation)
  minimal targeted fixes (no scope creep)
  regression prevention
  conventional commit discipline
}

Constraints {
  Do ONE step at a time. Do not skip steps or reorder them.
  Run `npm test` prior to committing code. Planning and documentation (epics, plan.md, docs, etc) are exempt.
  Never implement before writing a failing test.
  Never write a test after implementing — that is not TDD.
  Communicate each step to the user as friendly markdown prose with numbered lists — not raw SudoLang syntax.
}

## Step 1 — Gain Context and Validate
gainContext(bugReport | reviewFeedback) => confirmedIssue | stop {
  1. Read the relevant source file(s) and colocated test file(s) in `test-files/`
  2. Read `vision.md` and the task epic in `tasks/` (if one exists) that covers this area
  3. Reproduce or reason through the issue to confirm it exists
  4. no change needed => summarize findings; stop — do not modify any files
}

## Step 2 — Document the Requirement in the Epic
documentRequirement(confirmedIssue) => requirement {
  1. Locate the existing epic in `tasks/`; no matching epic => create one at `tasks/<name>-epic.md` using the `aidd-task-creator` skill
  2. Add a requirement in **"Given X, should Y"** format describing the correct observable behavior
  3. Epic update is a discrete step — commit it separately or include it in the fix commit

  epicConstraints {
    "Given X, should Y" format exactly
    no implementation detail — observable behavior only
  }
}

## Step 3 — TDD: Write a Failing Test First
writeFailingTest(requirement) => failingTest {
  Using the `aidd-tdd` skill:
  1. Write a test that captures the requirement in `test-files/`
  2. Run `npm test` and confirm the test **fails**
  3. test passes without implementation => stop and reassess — bug may already be fixed or test is wrong
}

## Step 4 — Implement the Fix
implementFix(failingTest) => fix {
  1. Write the minimum code needed to make the failing test pass
  2. Run `npm test` — fail => fix bug => repeat; pass => continue
  3. Implement ONLY what makes the test pass

  Constraints {
    no over-engineering or unrelated cleanup
  }
}

## Step 5 — Self-Review and Run All Tests
selfReviewAndTest(fix) => reviewedFix {
  1. Run /review and resolve any issues found
  2. Run `npm test` to confirm all changes pass (this repo has no separate e2e suite — one run covers everything)
}

## Step 6 — Commit
commitChange(reviewedFix) {
  Using /commit:
  1. Stage only the files changed by this fix
  2. Write a conventional commit message (e.g. `type(optional-scope): description`)
  3. Do NOT push. If the user wants the branch pushed, ask them to confirm the target remote/branch first, per this project's git safety rules.
}

fix = gainContext |> documentRequirement |> writeFailingTest |> implementFix |> selfReviewAndTest |> commitChange

Commands {
  🐛 /aidd-fix - fix a bug or review feedback following the full AIDD fix process
}
