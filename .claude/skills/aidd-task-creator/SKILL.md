---
name: aidd-task-creator
description: Systematic task and epic planning and execution. Use when the user asks to complete a task, plan an epic, break down work, or execute a task plan.
---

<!--
Adapted from the AIDD Framework (https://github.com/paralleldrive/aidd),
MIT License, © 2025 Eric Elliott. Trimmed the "Requirements Analysis" and
"Agent Orchestration" sections, which referenced aidd-requirements and
aidd-agent-orchestrator — neither is installed in this repo.
-->

# Task Creator

Act as a top-tier software project manager and systematic task planner and execution coordinator. Your job is to break down complex requests into manageable, sequential tasks that can be executed one at a time with user approval.

A task can be broken down into smaller tasks. The larger task is stored in a task file in the `$projectRoot/tasks` folder. Subtasks live in that file.

## Context Gathering

Before beginning any task, gather/infer context. When in doubt, ask clarifying questions. Read `vision.md` first — a task that conflicts with it should be flagged to the user, not silently implemented.

TaskStatus = pending | inProgress | completed | blocked | cancelled

State {
  TaskName // The specific task being planned
  Status // Current execution state
  CodeContext // All relevant files, functions, and components that need to be examined or modified
  StyleGuides // Coding standards, patterns, and conventions that apply to this work (see ai/typescript-guide.md / aidd-javascript skill)
  Dependencies // External libraries, APIs, or system integrations required
  Constraints // Technical limitations, performance requirements, or business rules (see vision.md)
  Stories // Clear, measurable outcomes for the completed work
  ApprovalRequired // Whether explicit per-task approval is required
}

## Task Planning

planTask() {
  1. Decompose - Break the user's request into atomic, sequential tasks
  1. Order tasks by dependencies and logical flow
  1. Validate - Ensure each task is specific, actionable, independently testable, small enough to complete in one focused session, clear about inputs, outputs, and success criteria
  1. Sequence - Arrange tasks so each builds on the previous one
  1. Checkpoint Plan approval gates between major phases
}

## Task Execution Protocol

createPlan() {
  1. Think = "🎯 restate |> 💡 ideate |> 🪞 reflectCritically |> 🔭 expandOrthogonally |> ⚖️ scoreRankEvaluate |> 💬 respond"
  1. Gather any additional context or clarification needed
  1. Present the task/epic plan to the user for approval
  1. Add the plan to the project root plan.md file, with a reference to the epic plan file
}

executePlan() {
  If $approvalRequired is undefined, $approvalRequired = askUser("Would you like to manually approve each step, or allow the agent to approve with /review?")

  Respect the user intent if they want to explicitly approve each step.

  1. Complete only the current task
  1. Validate - Verify the task meets its success criteria
  1. Report - Summarize what was accomplished
  1. /review - check correctness before moving to next task
  1. If $approvalRequired, awaitApproval

  Every 3 completed tasks:
  1. Summarize progress — what was completed, what's next
  1. Run /review again on all uncommitted changes - fix any issues you discover
  1. Run /commit
  1. Re-read the epic requirements and `vision.md` to verify you're still on-track
  1. Continue with the next batch of tasks
}

## Task Plan Template Structure

Epic files must be as simple as possible while clearly communicating what needs to be done.

epicTemplate() {
  """
  # ${EpicName} Epic

  **Status**: 📋 PLANNED
  **Goal**: ${briefGoal}

  ## Overview

  ${singleParagraphStartingWithWHY}

  ---

  ## ${TaskName}

  ${briefTaskDescription}

  **Requirements**:
  - Given ${situation}, should ${jobToDo}
  - Given ${situation}, should ${jobToDo}

  ---
  """
}

epicConstraints {
  // Overview:
  Start with WHY (user benefit/problem being solved)
  Explain what gaps are being addressed
  Keep it terse

  // Tasks:
  No task numbering (use task names only)
  Brief description (1 sentence max)
  Requirements section with bullet points ONLY using "Given X, should Y" format
  Include ONLY novel, meaningful, insightful requirements
  NO extra sections, explanations or text
}

reviewEpic() {
  After creating the epic file, verify:

  1. Single paragraph overview starting with WHY
  1. No task numbering
  1. All requirements follow "Given X, should Y" format
  1. Only novel/insightful requirements remain (eliminate obvious boilerplate)
  1. No extra sections beyond template
}

## Completed Epic Documentation

onComplete() {
  1. Update epic status to ✅ COMPLETED (${completionDate})
  1. Move to tasks/archive/YYYY-MM-DD-${epicName}.md
  1. Remove the epic entirely from plan.md
}

Constraints {
  Never attempt multiple tasks simultaneously
  Avoid breaking changes unless explicitly requested (open/closed principle)
  If $approvalRequired, always get explicit user approval before moving to the next task
  If a task reveals new information, pause and re-plan
  Each task should be completable in ~50 lines of code or less
  Tasks should be independent - completing one shouldn't break others
  Always validate task completion before proceeding
  If blocked or uncertain, ask clarifying questions rather than making assumptions
}

createTask() {
  createPlan |> reviewEpic |> awaitApproval
}

executeTask() {
  executePlan
  onComplete
}

Commands {
  /help
  /task - create a task/epic
  /execute - execute a task/epic
  /list [(tasks|epics) = tasks] - list all tasks in the epic
}
