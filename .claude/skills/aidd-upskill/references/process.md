# Skill Creation Process

<!--
Adapted from the AIDD Framework (https://github.com/paralleldrive/aidd),
MIT License, © 2025 Eric Elliott. `validate-skill` and `skills-ref` CLIs
referenced by upstream are not installed in this repo — `validate` below
is manual by default. The upstream "Eval Tests" section (Riteway AI) is
dropped since `aidd-riteway-ai`/`riteway` aren't installed here.
-->

## Pipeline

```
createSkill(userRequest) {
  gatherRequirements
    |> nameSkill
    |> think() --compact
    |> buildPlan
    |> presentPlan
    |> draftSkillMd
    |> writeSkill
    |> writeReadme
    |> validate
    |> reportMetrics
}
```

## Steps

**gatherRequirements(userRequest)**
1. discoverRelatedSkills — search `.claude/skills/` for `SKILL.md` files; read frontmatter descriptions; identify overlap or complementary skills
2. researchBestPractices — use web search to find best practices for the domain; summarize findings
3. Infer requirements from the above context. Do not ask clarifying questions or block on user input. Use a judge to evaluate completeness: yes → proceed; no → state gaps as explicit assumptions and proceed.

Infer answers to these questions from context:
- What problem does this skill solve?
- What are its inputs and outputs?
- Any technical constraints or requirements?
- Should it `alwaysApply`? (recommend yes only if it applies to nearly every task)

**nameSkill(topic)**
- Use verb or role-based noun form (e.g., `format-code`, `upskill`), prefixed with `aidd-` to match this repo's naming convention and stay git-tracked (see `.gitignore`)

**buildPlan() => SkillPlan**
Produce a `SkillPlan`

**presentPlan(plan: SkillPlan)**
Show the full plan, then run a self-validating quality gate — do not await user approval:

While important issues remain {
  reviewPlan |> fix
}

**draftSkillMd(plan: SkillPlan)**
- Write frontmatter: `name` + `description` required; add `metadata.alwaysApply` if needed
- Write body with all `RequiredSections`
- If body will exceed the line threshold in `references/types.md`'s `SizeMetrics`, extract content to `references/` and use `import $referenceFile`

**writeSkill(skillMd)**
- Write to `.claude/skills/${skillName}/SKILL.md`
- Create `scripts/`, `references/`, or `assets/` directories as required

**writeReadme(skillMd)**
- Write `README.md` in the skill directory
- Include: what the skill is, why it is useful, command reference with usage examples
- Exclude: implementation details, process narratives, pipeline descriptions
- Avoid tables

**validate**
No `validate-skill` CLI is installed in this repo (`npx aidd --help` doesn't
list it in the installed `aidd` version). Emulate the validation process
manually: check `RequiredSections` are present, estimate `SizeMetrics`
against the rule-of-thumb thresholds in `references/types.md`, and confirm
the frontmatter `description` alone is precise enough for an agent to
activate on.

**reportMetrics**
Report estimated `SizeMetrics` and any threshold concerns to the user.

## Skill Review Process

```
reviewSkill(target) {
  readSkill(target)
    |> runFunctionTest
    |> checkRequiredSections
    |> checkSizeMetrics
    |> checkCommandSeparation
    |> checkReadme
    |> deduplicate()
    |> think() --compact
    |> reportFindings
}
```

**runFunctionTest** — apply the 5-question Function Test from `SKILL.md`
**checkRequiredSections** — verify all `RequiredSections` are present
**checkSizeMetrics** — estimate against `references/types.md`'s thresholds and report concerns (no automated validator installed)
**checkCommandSeparation** — verify no command mixes thinking and side effects
**checkReadme** — verify README.md exists and contains what/why/commands; flag if it contains implementation details or process narratives
**deduplicate()** — find every instance of repeated information across SKILL.md and its references; flag each duplicate and identify where the single source of truth should live; use `think() --compact` to reason about the canonical location
**think() --compact** — synthesize all findings into a holistic judgment before rendering the verdict (uses the RTC `think()` function from `aidd-please`); independently testable as a pure thinking stage
**reportFindings** — produce a per-check pass/fail table (one row per check: runFunctionTest, checkRequiredSections, checkSizeMetrics, checkCommandSeparation, checkReadme, deduplicate) with columns for check name, result (✅/⚠️/❌), and detail; conclude with an overall verdict
