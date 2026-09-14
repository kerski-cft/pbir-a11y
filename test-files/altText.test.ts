import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { loadPbirFromFolder } from "../src/io/loadFromFolder";
import { analyze, ALL_CHECKS, type Issue } from "../src/lib/rulesEngine";

const FIXTURE = path.join(__dirname, "thin-report", "ThinReport.Report");

async function altTextIssuesById(): Promise<Map<string, Issue[]>> {
  const { report } = await loadPbirFromFolder(FIXTURE);
  const result = analyze(report, ALL_CHECKS);
  const byId = new Map<string, Issue[]>();
  for (const page of result.pages) {
    for (const visual of page.visuals) {
      byId.set(visual.visual.id, visual.issues.filter((i) => i.category === "altText"));
    }
  }
  return byId;
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
