import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { loadPbirFromFolder } from "../src/io/loadFromFolder";
import { analyze, ALL_CHECKS, type Issue } from "../src/lib/rulesEngine";

const FIXTURE = path.join(__dirname, "thin-report", "ThinReport.Report");

async function visualTitleIssuesById(): Promise<Map<string, Issue[]>> {
  const { report } = await loadPbirFromFolder(FIXTURE);
  const result = analyze(report, ALL_CHECKS);
  const byId = new Map<string, Issue[]>();
  for (const page of result.pages) {
    for (const visual of page.visuals) {
      byId.set(visual.visual.id, visual.issues.filter((i) => i.category === "visualTitles"));
    }
  }
  return byId;
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
