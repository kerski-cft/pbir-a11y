#!/usr/bin/env node
// Read-only analysis: finds the last version-bump commit, classifies every
// commit since by conventional-commit type, and proposes a semver bump.
// Run from the repo root: node .claude/skills/aidd-release/scripts/propose-release.js
"use strict";

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const cwd = process.cwd();

function git(args) {
  return execFileSync("git", args, { cwd, encoding: "utf8" });
}

function packageJsonAt(rev) {
  try {
    return JSON.parse(git(["show", `${rev}:package.json`]));
  } catch {
    return null;
  }
}

// The most recent commit where package.json's "version" field itself
// changed — not just any commit that touched the file. There are no git
// tags to anchor on (this repo has none), so history is the only source.
function findLastBumpCommit() {
  const shas = git(["log", "--format=%H", "--", "package.json"]).trim().split("\n").filter(Boolean);
  for (const sha of shas) {
    const current = packageJsonAt(sha);
    if (!current) continue;
    const parent = packageJsonAt(`${sha}^`);
    if (!parent || parent.version !== current.version) return sha;
  }
  return null; // no version-changing commit in history — use full log
}

function listShasSince(baseSha) {
  const range = baseSha ? `${baseSha}..HEAD` : "HEAD";
  const out = git(["log", "--format=%H", range]).trim();
  return out ? out.split("\n") : [];
}

const TYPE_RE = /^(\w+)(\([^)]*\))?(!)?:\s*(.*)$/;

function classifyCommit(sha) {
  const subject = git(["log", "-1", "--format=%s", sha]).trim();
  const body = git(["log", "-1", "--format=%B", sha]);
  const match = subject.match(TYPE_RE);
  const type = match ? match[1] : "other";
  const bangBreaking = match ? Boolean(match[3]) : false;
  const footerBreaking = /(^|\n)BREAKING[ -]CHANGE:/i.test(body);
  return { sha: sha.slice(0, 7), subject, type, breaking: bangBreaking || footerBreaking };
}

function bumpLevel(classified) {
  if (classified.some((c) => c.breaking)) return "major";
  if (classified.some((c) => c.type === "feat")) return "minor";
  if (classified.some((c) => c.type === "fix")) return "patch";
  return null;
}

function nextVersion(current, level) {
  const [maj, min, pat] = current.split(".").map(Number);
  if (level === "major") return `${maj + 1}.0.0`;
  if (level === "minor") return `${maj}.${min + 1}.0`;
  if (level === "patch") return `${maj}.${min}.${pat + 1}`;
  return current;
}

function main() {
  const pkg = JSON.parse(fs.readFileSync(path.join(cwd, "package.json"), "utf8"));
  const lastBumpSha = findLastBumpCommit();
  const shasSince = listShasSince(lastBumpSha);
  const classified = shasSince.map(classifyCommit);
  const level = bumpLevel(classified);
  const proposed = level ? nextVersion(pkg.version, level) : null;

  console.log(`Current version: ${pkg.version}`);
  console.log(
    lastBumpSha
      ? `Last version bump: ${lastBumpSha.slice(0, 7)} — ${git(["log", "-1", "--format=%s", lastBumpSha]).trim()}`
      : "Last version bump: none found in history — considering all commits",
  );
  console.log(`Commits since: ${classified.length}`);

  const byType = {};
  for (const c of classified) byType[c.type] = (byType[c.type] || 0) + 1;
  for (const [type, count] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type}: ${count}`);
  }
  const breaking = classified.filter((c) => c.breaking);
  if (breaking.length > 0) {
    console.log(`  breaking: ${breaking.length} (${breaking.map((c) => c.sha).join(", ")})`);
  }

  if (!level) {
    console.log("\nNo release-worthy commits since the last bump (only chore/docs/test/etc.).");
    process.exit(0);
  }

  console.log(`\nProposed bump: ${level}`);
  console.log(`Proposed version: ${pkg.version} -> ${proposed}`);
}

main();
