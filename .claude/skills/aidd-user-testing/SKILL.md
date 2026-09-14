---
name: aidd-user-testing
description: Generate human and AI agent test scripts from user journey specifications, for exercising the pbir-a11y CLI. Use when creating user test scripts, running user tests, or validating user journeys.
---

<!--
Adapted from the AIDD Framework (https://github.com/paralleldrive/aidd),
MIT License, © 2025 Eric Elliott. pbir-a11y is a CLI with no UI, so this
skill is rewired from browser-driven testing (screenshots, video, a real
browser session) to CLI-driven testing (terminal transcripts, scripted
command sequences against fixture projects like test-files/thin-report).
/run-test (execute an agent script in a real browser) is dropped entirely —
there's no browser to drive; the agent script below is just a sequence of
shell commands the agent runs directly. Upstream's promotional "Need
Professional User Testing?" offer/purchase-link section is also dropped —
not appropriate to carry into an unrelated project.
-->

# User Testing Generator

Use UserJourney and Persona from the `aidd-product-manager` skill.

Generate dual test scripts: human (terminal walkthrough, think-aloud protocol) + AI agent (executable shell command sequence, no browser needed).

## Types

UserTestPersona {
  ...Persona
  role
  techLevel: "novice" | "intermediate" | "expert"
  patience: 1..10
  goals: string[]
}

UserTestStep {
  ...Step
  action       // a `pbir-a11y` CLI invocation, e.g. `pbir-a11y check ./MyReport --json`
  intent
  success      // observable outcome: exit code, expected substring in output, expected JSON field
  checkpoint?: boolean
}

## Scripts

HumanScript:template {
  """
  # Test: ${journey.name}

  **Persona**: ${persona.name} — ${persona.role}

  ## Pre-test
  - Optionally record the terminal session (e.g. `script session.log` or an asciinema recording)
  - Reset fixture state: `git checkout -- test-files/` (or use a fresh copy of the relevant PBIP project) so prior runs don't leave stray output files (`--docx` exports, etc.)

  ## Instructions
  Read each step out loud before attempting it. Think aloud as you work - this helps reviewers follow along.

  ## Steps
  For each step:
  - Goal: ${step.intent}
  - Do: ${step.action}
  - Think aloud: What did the CLI print? Any confusing output or exit code?
  - Success: ${step.success}

  ## Post-test
  - Stop recording (if recording)
  - What output was confusing?
  - What worked well?
  - Would you rely on this in a real CI pipeline or pre-commit hook?
  """
}

AgentScript:template {
  """
  # Agent Test: ${journey.name}

  **Environment**: Run the `pbir-a11y` CLI directly in a terminal against a fixture project (e.g. `test-files/thin-report`). No browser, no source-code access beyond the documented command reference (`pbir-a11y explain`, `--help`) needed.

  **Persona behavior**:
  - Patience: ${persona.patience}/10
  - Retry: ${persona.techLevel == "expert" ? "immediate" : "re-read --help/explain output before retrying"}
  - On failure: ${persona.patience > 5 ? "retry with adjusted flags" : "abort and report"}

  ## Execution
  For each step, narrate your reasoning like a human tester:
  1. Run the command: ${step.action}
  2. Note the exit code and express what you expected vs. what you saw
  3. Validate the result: ${step.success}
  4. On checkpoint or failure, capture the full stdout/stderr (or `--json` output) rather than a screenshot
  5. Record: difficulty (easy/moderate/difficult), and what was unclear
  6. Retry with adjusted flags if failed and patient

  ## Output Format
  ```markdown
  # Test Report: ${journey.name}

  **Completed**: X of Y steps

  ## Step: [step name]
  - **Status**: ✓ Success / ✗ Failed
  - **Command**: `pbir-a11y ...`
  - **Exit code**: N
  - **Difficulty**: easy/moderate/difficult
  - **Thoughts**: [What I saw, expected, any confusion]
  - **Captured output**: [relevant stdout/--json excerpt, if checkpoint or failure]

  ## Blockers
  - [Any steps that couldn't be completed and why]
  ```
  """
}

generateScripts(journey) => human + agent templates with persona-mapped behavior

## FileLocations

User test scripts are saved to `$projectRoot/plan/` folder (create if not present):
- Human test scripts: `$projectRoot/plan/${journey-name}-human-test.md`
- Agent test scripts: `$projectRoot/plan/${journey-name}-agent-test.md`
- User journeys reference the YAML files in `$projectRoot/plan/story-map/${journey-name}.yaml`

Note: Journey YAML files use base Persona (meta fields only) from the
`aidd-product-manager` skill. When generating test scripts from a journey,
extend personas to UserTestPersona:

UserTestPersona {
  ...Persona // from journey YAML
  role = infer()
  techLevel = infer()
  patience = infer()
  goals = infer()
}

## Interface

/user-test <journey> - Generate human and agent CLI test scripts, save to `$projectRoot/plan/`

Constraints {
  Persona traits → behavior (patience → retries, techLevel → retry strategy)
  Both scripts validate identical success criteria
  Prefer `--json` output as the source of truth when validating success criteria programmatically, over parsing human-readable terminal output (same caveat the `pbir-a11y` skill itself calls out for truncated terminal scrollback)
}
