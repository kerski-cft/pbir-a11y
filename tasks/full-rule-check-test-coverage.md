# Full Rule-Check Test Coverage Epic

**Status**: 📋 PLANNED
**Goal**: Give every automated rule-check category in `rulesEngine.ts`
direct test coverage, gated by a coverage-threshold check.

## Overview

Only `altText` (and its `groupNaming` sub-case) have direct tests today;
the other 8 categories (`visualTitles`, `axisTitles`, `fontScaling`,
`contrast`, `pageTitles`, `tabOrder`, `targetSize`, `clutter`) have none,
so a change to `rulesEngine.ts` could silently break one without any test
failing — undermining `vision.md`'s core parity-with-the-original-tool
promise. `colourblind` is excluded from that list: its `analyze()`-level
emission is commented out (it's a UI-simulator toggle now, not an
automated rule), so it gets a direct unit test of
`colourblindUtils.findCollisions()` instead. Scoped per discovery
(2026-09-14): Node's built-in `--experimental-test-coverage` (no new
dependency), scoped to `src/lib/**`, threshold near today's baseline
(~65% lines), wired up as a separate `npm run coverage` script, tests
extend the real `test-files/thin-report/` fixture rather than construct
synthetic `ParsedReport` objects (per the `aidd-tdd` skill). Every task
below pairs a flagged-case test with a compliant-case test proving the
check does *not* fire on valid content, per `vision.md`'s false-positive
guard.

---

## Wire up npm run coverage script

Add an `npm run coverage` script running `node --test
--experimental-test-coverage` scoped to `src/lib/**`, with a line-coverage
threshold near today's baseline.

**Requirements**:
- Given `npm run coverage`, should report a concise per-file summary for
  `src/lib/**` only
- Given coverage at or above the threshold, should exit 0
- Given coverage below the threshold, should exit non-zero

---

## Add tests for visualTitles and axisTitles

Extend `test-files/thin-report/` with a chart whose title is turned off, a
slicer with no title text, and a chart with X/Y axis titles turned off;
add `test-files/visualTitles.test.ts` (or extend an existing file)
asserting the resulting issues.

**Requirements**:
- Given a chart visual with its title turned off, should produce a
  `visualTitles` warn issue
- Given a slicer with no authored title text, should produce a
  `visualTitles` warn issue (slicers don't auto-generate one)
- Given a chart with X-axis or Y-axis title turned off, should produce a
  corresponding `axisTitles` warn issue
- Given a chart with both axis titles on, should produce no `axisTitles`
  issue for that visual

---

## Add tests for fontScaling and contrast

Extend the fixture with a visual using an 8pt label (below the 12pt
minimum at 1280×720) and a visual with a low-contrast title color
(`#CCCCCC` on the default white background).

**Requirements**:
- Given a visual with a font size below `minFontPt` for the page's
  canvas, should produce a `fontScaling` warn issue
- Given a visual with a title/background color pair failing WCAG AA
  (< 4.5:1), should produce a `contrast` fail issue
- Given a visual with a passing color pair, should produce no `contrast`
  issue for that visual

---

## Add tests for pageTitles and tabOrder

Add a second fixture page with a textbox positioned near the top (so
`pageTitleVisible` is true), and visuals with a duplicate tab-order value
and a focusable decorative shape.

**Requirements**:
- Given a page with no textbox/card near the top, should produce a
  `pageTitles` warn issue (covers the existing `Page1` fixture)
- Given a page with a textbox near the top, should produce no
  `pageTitles` issue
- Given two visuals sharing the same authored tab-order value, should
  produce a `tabOrder` fail issue
- Given a decorative shape with a non-hidden tab-order index, should
  produce a `tabOrder` warn issue
- Given a page with unique tab-order values and no focusable decorative
  shapes, should produce no `tabOrder` issue

---

## Add tests for targetSize and clutter

Add an undersized interactive control (e.g. a 20×20px button, below the
24×24px WCAG floor) and several overlapping data visuals dense enough to
trigger the "High" clutter score.

**Requirements**:
- Given an interactive visual smaller than the WCAG 2.5.8 minimum
  (24×24px, scaled to canvas), should produce a `targetSize` fail issue
- Given an interactive visual at or above the recommended size, should
  produce no `targetSize` issue
- Given a page with data visuals producing more than 4 overlaps (or
  density/count over the "High" thresholds in `clutterIndex.ts`), should
  produce a `clutter` warn issue
- Given a page with a low-density, non-overlapping layout, should produce
  no `clutter` issue

---

## Add colourblindUtils.test.ts

Add a direct unit test of `colourblindUtils.findCollisions()` — not
through `analyze()`, since that emission path is commented out today.

**Requirements**:
- Given a palette containing a known protanopia/deuteranopia-colliding
  pair (e.g. red/green), should report a collision
- Given a palette of clearly distinguishable colors, should report no
  collisions

---
