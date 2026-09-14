import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeFixture, visualIssuesByCategory } from "./testHelpers";

async function visualTitleIssuesById() {
  return visualIssuesByCategory(await analyzeFixture(), "visualTitles");
}

test("a visual group with a real author-given name is not flagged", async () => {
  const issues = await visualTitleIssuesById();
  assert.deepEqual(issues.get("groupA"), []);
});

test("a visual group left with Power BI's default name is flagged", async () => {
  const issues = await visualTitleIssuesById();
  const groupIssues = issues.get("groupDefaultName") ?? [];
  assert.equal(groupIssues.length, 1);
  assert.equal(groupIssues[0].id, "groupDefaultName-group-name-default");
  assert.equal(groupIssues[0].severity, "warn");
});
