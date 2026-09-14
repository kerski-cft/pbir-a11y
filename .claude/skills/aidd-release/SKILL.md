---
name: aidd-release
description: Propose and apply a version bump for pbir-a11y — classifies conventional-commit types since the last version-bump commit, computes the semver level (patch/minor/major), and after confirmation updates package.json, commits, and creates a git tag. Use when the user asks to cut a release, bump the version, or invokes /release.
allowed-tools: Bash(git:*) Bash(node:*)
---

<!--
This skill's scripts/ split (analysis vs. mutation) follows the
aidd-upskill guidance: classifying commits and computing a semver bump is
deterministic, so it lives in scripts, not free-form reasoning. The
skill's own job is the judgment call — presenting the proposal and
taking confirmation — plus invoking the scripts.
-->

# aidd-release

Act as a release manager for `pbir-a11y` itself. Versioning here has
historically been ad hoc manual `package.json` edits — sometimes bundled
into unrelated feature commits with no dedicated message — which is
exactly how the CLI's `--version` flag drifted out of sync with the real
package version. This skill replaces that with a small, repeatable
process: propose a version from real commit history, confirm it with the
user, then apply it.

## Process

```
release() {
  runScript("scripts/propose-release.js")
    |> presentProposal
    |> confirmOrOverride
    |> runScript("scripts/apply-release.js", confirmedVersion)
}
```

1. **Run `scripts/propose-release.js`** (from the repo root). It finds
   the last commit where `package.json`'s `version` field actually
   changed (there are no git tags to anchor on), classifies every commit
   since by conventional-commit type, and prints a proposed bump level
   and next version — or says there's nothing release-worthy.
2. **Present the proposal** to the user: current version, the commit
   breakdown by type, and the proposed next version. If there's nothing
   release-worthy, say so and stop — don't invent a bump.
3. **Confirm or override.** Ask the user to confirm the proposed version
   or give a different one. Never proceed to step 4 without an explicit
   version the user has agreed to.
4. **Run `scripts/apply-release.js <version>`** with the confirmed
   version. It rewrites only the `"version"` field in `package.json`,
   commits with `chore(release): v<version>`, and creates an annotated
   tag `v<version>`. Use `--dry-run` first if there's any doubt about
   what it will do.

## Constraints

```
Constraints {
  Never call apply-release.js with a version the user has not explicitly confirmed.
  Never push the release commit or tag automatically — matches this repo's existing /commit convention.
  If propose-release.js finds nothing release-worthy (no feat/fix/breaking commits since the last bump), say so and stop rather than proposing a bump anyway.
  Run both scripts from the repo root (they resolve package.json and git history relative to the current working directory).
}
```
