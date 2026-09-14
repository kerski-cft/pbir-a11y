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

test("a chart with its title turned off is flagged for visualTitles", async () => {
  const issues = await issuesById("visualTitles");
  const found = issues.get("barTitleOff") ?? [];
  assert.equal(found.length, 1);
  assert.equal(found[0].id, "barTitleOff-title-off");
  assert.equal(found[0].severity, "warn");
});

test("a slicer with no authored title text is flagged for visualTitles", async () => {
  const issues = await issuesById("visualTitles");
  const found = issues.get("slicerNoTitle") ?? [];
  assert.equal(found.length, 1);
  assert.equal(found[0].id, "slicerNoTitle-title-missing");
});

test("a chart with its title shown and text set is not flagged for visualTitles", async () => {
  const issues = await issuesById("visualTitles");
  assert.deepEqual(issues.get("barAxesOn"), []);
});

test("a chart with both axis titles turned off is flagged for axisTitles on each axis", async () => {
  const issues = await issuesById("axisTitles");
  const found = issues.get("barAxesOff") ?? [];
  const ids = found.map((i) => i.id).sort();
  assert.deepEqual(ids, ["barAxesOff-x-axis-title-off", "barAxesOff-y-axis-title-off"]);
});

test("a chart with both axis titles turned on is not flagged for axisTitles", async () => {
  const issues = await issuesById("axisTitles");
  assert.deepEqual(issues.get("barAxesOn"), []);
});
