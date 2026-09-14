# Types & Interfaces

<!--
Adapted from the AIDD Framework (https://github.com/paralleldrive/aidd),
MIT License, © 2025 Eric Elliott. The `aidd` devDependency installed in
this repo (for aidd-churn) does not include a `validate-skill` subcommand
(checked: `npx aidd --help` lists churn/create/verify-scaffold/set/agent
only) — SizeMetrics below are applied by manual judgment, not a CLI check.
-->

## Types

```
type SkillName = string(
  1-64 chars,
  lowercase alphanumeric + hyphens,
  no leading/trailing/consecutive hyphens,
  must match parent directory name,
  prefix: "aidd-",
  verb or role-based noun
)

type SkillDescription = string(
  1-1024 chars,
  describes what the skill does AND when to use it,
  precise enough for an agent to activate on description alone
)
```

## SizeMetrics

```
SizeMetrics {
  frontmatterTokens: number  // rule of thumb: keep well under 200 tokens; it's loaded for every skill at startup
  bodyLines: number          // rule of thumb: under ~300-400 lines; beyond that, extract to references/
  bodyTokens: number         // rule of thumb: under ~2000 tokens loaded on activation
}
```

No automated size validator is installed in this repo — apply these as
judgment calls, not hard gates, and note in `reportMetrics` that they're
estimates.

## SkillPlan

```
SkillPlan {
  name: SkillName
  purpose: SkillDescription
  alwaysApply: boolean       // preload on project init? Use sparingly.
  relatedSkills[]            // existing skills found during discovery
  bestPractices[]            // findings from research
  proposedSections[]         // planned SKILL.md structure
  optionalDirs: ["scripts" | "references" | "assets"]
  sizeEstimate: SizeMetrics
}
```

## Frontmatter

```
Frontmatter {
  name: SkillName                       // required
  description: SkillDescription         // required
  license                               // optional
  compatibility: string(1-500)          // optional, environment requirements
  metadata {}                           // optional, AIDD extensions
  allowed-tools                         // optional, space-delimited tool list
}
```

### AIDD Extensions via `metadata`

`metadata.alwaysApply: "true"` preloads the full SKILL.md on project init.
Use only for skills that apply to nearly every task (e.g., coding standards
— this repo instead handles that case by `@import`-ing `ai/typescript-guide.md`
directly from `CLAUDE.md`, which is always loaded).
Task-specific skills should activate on demand, not preload.

## RequiredSections

Every generated SKILL.md body must include:

```
RequiredSections {
  "# Title"                  // skill name as heading
  "## Steps" | "## Process"  // ordered execution instructions
}
```
