---
name: aidd-tdd
description: Systematic test-driven development with proper test isolation. Use when implementing code changes, writing tests, or when TDD process guidance is needed.
---

<!--
Adapted from the AIDD Framework (https://github.com/paralleldrive/aidd),
MIT License, © 2025 Eric Elliott. Upstream's "Default Test Utils" section
assumed Vitest/Riteway/React/Playwright; this repo tests with Node's
built-in `node:test` + `node:assert` runner (see package.json's "test"
script) and has no UI, so that section is rewritten below.
-->

# TDD Engineer

Act as a top-tier software engineer with serious TDD discipline to systematically implement software using the TDD process.

## assert

type assert = ({ given: string, should: string, actual: any, expected: any }) {
  `given` and `should` must clearly state the functional requirements from an acceptance perspective, and should avoid describing literal values.
  Tests must demonstrate locality: The test should not rely on external state or other tests.

  Ensure that the test answers these 5 questions {
    1. What is the unit under test? (test should be in a named describe block)
    2. What is the expected behavior? ($given and $should arguments are adequate)
    3. What is the actual output? (the unit under test was exercised by the test)
    4. What is the expected output? ($expected and/or $should are adequate)
    5. How can we find the bug? (implicitly answered if the above questions are answered correctly)
  }

  Tests must be:
  - Readable - Answer the 5 questions.
  - Isolated/Integrated
    - Units under test should be isolated from each other
    - Tests should be isolated from each other with no shared mutable state.
    - For integration tests, test integration with the real system.
  - Thorough - Test expected/very likely edge cases
  - Explicit - Everything you need to know to understand the test should be part of the test itself. If you need to produce the same data structure many times for many test cases, create a factory function and invoke it from the individual tests, rather than sharing mutable fixtures between tests.
}

## Process

For each unit of code, create a test suite, one requirement at a time:

1. If the calling API is unspecified, propose a calling API that serves the functional requirements and creates an optimal developer experience.
1. Write a test. Run `npm test` and watch the test fail.
1. Implement the code to make the test pass. Implement ONLY the code needed to make the test pass.
1. Run `npm test`: fail => fix bug; pass => continue
1. Get approval from the user before moving on.
1. Repeat the TDD iteration process for the next functional requirement.

## Test Wrappers

This repo uses Node's built-in test runner (`node --test`, see `package.json`'s `test` script): `import { test } from "node:test"` and `import assert from "node:assert/strict"`. Existing tests (`test-files/altText.test.ts`, `test-files/groupNaming.test.ts`) use flat `test(name, fn)` calls — no `describe` wrapper — with the unit-under-test named in the test string itself.

Name each `test()` so it answers the 5 questions above in the string itself, e.g. `test("a real visual with alt text set is not flagged", ...)` — since `node:assert` has no dedicated `given`/`should` API, the test name carries that framing (phrase it as "given X, should Y" when the plain description alone doesn't make the scenario obvious).

Colocate new tests with existing ones in `test-files/*.test.ts`, following the existing pattern (see `altTextIssuesById()` in `altText.test.ts` for the "factory function instead of shared mutable fixture" pattern), not in a separate top-level `tests/` directory.

## Test Utilities

- Spies/stubs: `node:test`'s built-in `t.mock` (`t.mock.fn()`, `t.mock.method()`) — no extra test-double library needed.
- Fixtures: this repo already has `test-files/thin-report/` as a minimal PBIP/PBIR fixture project; extend it or add a new fixture folder rather than inlining large JSON blobs in test files.
- There is no UI in this project (it's a CLI) — no component-rendering or browser-interaction test utilities apply here.

Constraints {
  Unless directed otherwise, always colocate tests with the code they are testing.
  Carefully think through correct output.
  Avoid hallucination.
  This is very important to ensure software works as expected and that user safety is protected. Please do your best work.
  Avoid writing tests for expected types/shapes. It would be redundant with TypeScript's own type checks.

  Mocking is a code smell. {
    mocks in unit tests => build both a mocked and an integration candidate; the winning approach must (1) be no more complex than the alternative AND (2) meaningfully exercise the functional requirement of the unit under test — not just verify mock calls. Mocks are only justified when real integration is (a) technically infeasible or (b) prohibitively expensive — meaning irrecoverable real-world side effects, resources unavailable in CI, or per-run cost that makes the test suite economically non-viable. For this repo, exercising the real `src/lib/*` rule engine against a real fixture project (like `test-files/thin-report/`) is almost always cheaper and more meaningful than mocking it.
  }
}

State {
  testFramework = Node's built-in `node:test` + `node:assert`
  libraryStack = TypeScript, Commander, JSZip, docx
}
