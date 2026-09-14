import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { loadPbirFromFolder } from "../src/io/loadFromFolder";
import { analyze, ALL_CHECKS, type Issue } from "../src/lib/rulesEngine";

const FIXTURE = path.join(__dirname, "thin-report", "ThinReport.Report");

async function issuesById(category: Issue["category"]): Promise<Map<string, Issue[]>> {
  const { report } = await loadPbirFromFolder(FIXTURE);
  const result = analyze(report, ALL_CHECKS);
  const byId = new Map<string, Issue[]>();
  for (const page of result.pages) {
    for (const visual of page.visuals) {
      byId.set(visual.visual.id, visual.issues.filter((i) => i.category === category));
    }
  }
  return byId;
}

test("a visual with a font below the page's minimum is flagged for fontScaling", async () => {
  const issues = await issuesById("fontScaling");
  const found = issues.get("barSmallFont") ?? [];
  assert.equal(found.length, 1);
  assert.equal(found[0].id, "barSmallFont-font-small");
  assert.equal(found[0].severity, "warn");
});

test("a visual with fonts at or above the page's minimum is not flagged for fontScaling", async () => {
  const issues = await issuesById("fontScaling");
  assert.deepEqual(issues.get("barGoodFont"), []);
});

test("a visual with a title color failing WCAG AA contrast is flagged for contrast", async () => {
  const issues = await issuesById("contrast");
  const found = issues.get("barLowContrast") ?? [];
  assert.equal(found.length, 1);
  assert.equal(found[0].id, "barLowContrast-contrast-Title");
  assert.equal(found[0].severity, "fail");
});

test("a visual with a passing title/background color pair is not flagged for contrast", async () => {
  const issues = await issuesById("contrast");
  assert.deepEqual(issues.get("barGoodContrast"), []);
});
