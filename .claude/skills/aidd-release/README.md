# aidd-release

A skill for cutting a `pbir-a11y` release without the ad hoc
`package.json` edits the repo used before. It looks at the commits since
the last version bump, works out whether they add up to a patch, minor,
or major release under semver, and proposes that to you before touching
anything.

## Why it's useful

Versioning here used to be a manual edit with no consistent process —
sometimes bundled into an unrelated feature commit with no dedicated
message. That's exactly how the CLI's `--version` flag ended up stuck on
`0.1.0` while the real package version moved on to `0.3.2`. This skill
makes the bump decision visible and repeatable: it shows you the commits
it's counting and why, so you can agree with its proposal or override it
before anything is committed or tagged.

## Commands

- `/release` — walks through the whole flow: proposes a version, asks
  you to confirm or override it, then applies the bump (updates
  `package.json`, commits, and tags) once you've agreed.

## Usage examples

Typical flow, invoked via `/release`:

```
You: /release
Claude: Current version 0.3.2. Since the last bump (11 commits): 4 feat,
        3 other, 2 test, 1 fix, 1 chore. Proposing a minor bump to
        0.4.0. Sound right, or would you like a different version?
You: yes
Claude: Bumped 0.3.2 -> 0.4.0, committed, and tagged v0.4.0. Not pushed.
```

If nothing release-worthy has landed since the last bump (only
chore/docs/test commits), it says so instead of proposing a version.

The underlying scripts can also be run directly for a dry look, without
going through the skill:

```bash
node .claude/skills/aidd-release/scripts/propose-release.js
node .claude/skills/aidd-release/scripts/apply-release.js 0.4.0 --dry-run
```
