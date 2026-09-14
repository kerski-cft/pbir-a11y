import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeFixture, visualIssuesByCategory } from "./testHelpers";

async function altTextIssuesById() {
  return visualIssuesByCategory(await analyzeFixture(), "altText");
}

test("visualGroup containers are not flagged for missing alt text", async () => {
  const issues = await altTextIssuesById();
  assert.deepEqual(issues.get("groupA"), [], "group container should have no altText issues");
});

test("a real visual with alt text set is not flagged", async () => {
  const issues = await altTextIssuesById();
  assert.deepEqual(issues.get("visGoodAlt"), []);
});

test("a real visual missing alt text is still flagged", async () => {
  const issues = await altTextIssuesById();
  const visualIssues = issues.get("visMissingAlt") ?? [];
  assert.equal(visualIssues.length, 1);
  assert.equal(visualIssues[0].id, "visMissingAlt-alt-missing");
  assert.equal(visualIssues[0].severity, "fail");
});
