// Custom Visuals Warning  -  non-scored advisory check.
//
// Detection runs against the already-parsed report (the same ParsedVisual
// objects produced by pbixParser / pbirParser). No additional file parsing,
// network call or storage occurs: this re-uses the in-memory `type` strings
// that were extracted entirely in the user's browser when they uploaded the
// file. Comparison is done against a hard-coded whitelist of native Power BI
// visual identifiers  -  no lookup service.

import type { AnalysisResult } from "./rulesEngine";

/**
 * Hard-coded whitelist of native Power BI `visualType` identifiers as they
 * appear in PBIX `Report/Layout` JSON and PBIP/PBIR `visual.json` files.
 *
 * Anything *not* in this set is treated as a custom (AppSource or
 * organisational) visual and surfaces an advisory warning.
 *
 * Generated from the current Power BI Desktop release plus the identifiers
 * already mapped in `FRIENDLY_TYPES` in `rulesEngine.ts`.
 */
export const NATIVE_VISUAL_TYPES: ReadonlySet<string> = new Set<string>([
  "actionButton",
  "advancedSlicerVisual",
  "animatedNumber",
  "areaChart",
  "azureMap",
  "barChart",
  "basicShape",
  "bookmarkNavigator",
  "card",
  "cardVisual",
  "cardStrip",
  "chicletSlicer",
  "clusteredBarChart",
  "clusteredColumnChart",
  "columnChart",
  "comboChart",
  "decompositionTreeVisual",
  "donutChart",
  "filledMap",
  "funnel",
  "gauge",
  "hundredPercentStackedBarChart",
  "hundredPercentStackedColumnChart",
  "image",
  "kpi",
  "lineChart",
  "lineClusteredColumnComboChart",
  "lineStackedColumnComboChart",
  "listSlicer",
  "map",
  "matrix",
  "multiRowCard",
  "pageNavigator",
  "pieChart",
  "pivotTable",
  "qnaVisual",
  "rdlReport",
  "ribbonChart",
  "scatterChart",
  "shape",
  "shapeMap",
  "slicer",
  "stackedAreaChart",
  "stackedBarChart",
  "stackedColumnChart",
  "sunburstChart",
  "tableEx",
  "text",
  "textbox",
  "treemap",
  "waterfallChart",
  "wordCloud",
]);

export interface CustomVisualHit {
  pageName: string;
  visualId: string;
  visualType: string;
}

/**
 * Walk every page/visual in an AnalysisResult and return any visuals whose
 * `type` does not appear in {@link NATIVE_VISUAL_TYPES}.
 */
export function detectCustomVisuals(data: AnalysisResult): CustomVisualHit[] {
  const hits: CustomVisualHit[] = [];
  for (const p of data.pages) {
    for (const vr of p.visuals) {
      const t = (vr.visual.type ?? "").trim();
      if (!t) continue;
      // Some unknown placeholders from the parser shouldn't be treated as custom.
      if (t.toLowerCase() === "unknown") continue;
      if (!NATIVE_VISUAL_TYPES.has(t)) {
        hits.push({
          pageName: p.page.displayName,
          visualId: vr.visual.id,
          visualType: t,
        });
      }
    }
  }
  return hits;
}
