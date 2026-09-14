#!/usr/bin/env node
// Applies an already-confirmed version bump: updates package.json, commits,
// and creates an annotated git tag. Takes the version as an explicit
// argument — it never re-derives it — so there's no drift between what a
// human confirmed and what gets applied.
// Usage: node .claude/skills/aidd-release/scripts/apply-release.js <version> [--dry-run]
"use strict";

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const cwd = process.cwd();
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const version = args.find((a) => !a.startsWith("--"));

if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
  console.error("Usage: node apply-release.js <version> [--dry-run]");
  console.error('  <version> must be plain semver, e.g. "0.4.0" (no leading "v").');
  process.exit(1);
}

const pkgPath = path.join(cwd, "package.json");
const pkgRaw = fs.readFileSync(pkgPath, "utf8");
const pkg = JSON.parse(pkgRaw);
const oldVersion = pkg.version;
const tag = `v${version}`;

if (dryRun) {
  console.log(`[dry-run] Would bump package.json version ${oldVersion} -> ${version}`);
  console.log(`[dry-run] Would commit: chore(release): ${tag}`);
  console.log(`[dry-run] Would create annotated tag: ${tag}`);
  process.exit(0);
}

// Refuse to commit if anything is already staged — otherwise `git commit`
// would sweep unrelated staged content into the release commit alongside
// package.json.
const alreadyStaged = execFileSync("git", ["diff", "--cached", "--name-only"], { cwd, encoding: "utf8" }).trim();
if (alreadyStaged) {
  console.error("Refusing to release: other changes are already staged:");
  console.error(alreadyStaged);
  console.error("Commit or unstage them first, then re-run.");
  process.exit(1);
}

const versionLineRe = /("version"\s*:\s*")([^"]+)(")/;
if (!versionLineRe.test(pkgRaw)) {
  console.error('Could not find a "version" field in package.json.');
  process.exit(1);
}
fs.writeFileSync(pkgPath, pkgRaw.replace(versionLineRe, `$1${version}$3`));

execFileSync("git", ["add", "package.json"], { cwd, stdio: "inherit" });
execFileSync("git", ["commit", "-m", `chore(release): ${tag}`], { cwd, stdio: "inherit" });
execFileSync("git", ["tag", "-a", tag, "-m", tag], { cwd, stdio: "inherit" });

console.log(`\nBumped ${oldVersion} -> ${version}, committed, and tagged ${tag}.`);
console.log("Not pushed — push the commit and tag manually when ready.");
