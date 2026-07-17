export interface BBox { x: number; y: number; w: number; h: number; id: string; type: string }

export interface ClutterResult {
  visualCount: number; // logical count (KPI card rows grouped as 1)
  rawVisualCount: number; // unmodified visual container count
  groupedCardCount: number; // how many individual cards were grouped
  totalArea: number;
  canvasArea: number;
  density: number;
  overlaps: { a: string; b: string }[];
  score: "Low" | "Medium" | "High";
}

// Power BI users frequently build a "KPI strip" out of N separate `card`
// visuals placed side-by-side, one per measure. Visually + cognitively this is
// a single component, so we collapse adjacent card visuals into one logical
// unit before scoring clutter. We treat two card visuals as part of the same
// strip when they share roughly the same row/column and sit close together.
const CARD_TYPES = new Set(["card", "cardVisual", "multiRowCard"]);

function groupCardStrips(boxes: BBox[]): { logical: BBox[]; grouped: number } {
  const cards = boxes.filter((b) => CARD_TYPES.has(b.type));
  const others = boxes.filter((b) => !CARD_TYPES.has(b.type));
  if (cards.length < 2) return { logical: boxes, grouped: 0 };

  const parent = cards.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const union = (a: number, b: number) => {
    const ra = find(a), rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };

  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      const a = cards[i], b = cards[j];
      // Same row: vertical overlap > 50% of smaller height, horizontal gap small
      const vOverlap = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
      const hOverlap = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
      const minH = Math.min(a.h, b.h);
      const minW = Math.min(a.w, b.w);
      const hGap = Math.max(a.x, b.x) - Math.min(a.x + a.w, b.x + b.w);
      const vGap = Math.max(a.y, b.y) - Math.min(a.y + a.h, b.y + b.h);
      const sameRow = vOverlap > 0.5 * minH && hGap <= Math.max(40, 0.5 * minW);
      const sameCol = hOverlap > 0.5 * minW && vGap <= Math.max(40, 0.5 * minH);
      if (sameRow || sameCol) union(i, j);
    }
  }

  const groups = new Map<number, BBox[]>();
  cards.forEach((c, i) => {
    const r = find(i);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r)!.push(c);
  });

  let grouped = 0;
  const merged: BBox[] = [];
  for (const grp of groups.values()) {
    if (grp.length === 1) {
      merged.push(grp[0]);
      continue;
    }
    grouped += grp.length - 1;
    const x = Math.min(...grp.map((g) => g.x));
    const y = Math.min(...grp.map((g) => g.y));
    const x2 = Math.max(...grp.map((g) => g.x + g.w));
    const y2 = Math.max(...grp.map((g) => g.y + g.h));
    merged.push({
      id: `cardstrip-${grp.map((g) => g.id).join("-")}`,
      type: "cardStrip",
      x, y, w: x2 - x, h: y2 - y,
    });
  }
  return { logical: [...others, ...merged], grouped };
}

function intersect(a: BBox, b: BBox) {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);
  if (x2 <= x1 || y2 <= y1) return 0;
  return (x2 - x1) * (y2 - y1);
}

export function clutterIndex(canvasW: number, canvasH: number, boxes: BBox[]): ClutterResult {
  const canvasArea = Math.max(1, canvasW * canvasH);
  const { logical, grouped } = groupCardStrips(boxes);
  const totalArea = logical.reduce((s, b) => s + b.w * b.h, 0);
  const density = totalArea / canvasArea;
  const overlaps: { a: string; b: string }[] = [];
  for (let i = 0; i < logical.length; i++) {
    for (let j = i + 1; j < logical.length; j++) {
      const ai = intersect(logical[i], logical[j]);
      if (ai > 0.05 * Math.min(logical[i].w * logical[i].h, logical[j].w * logical[j].h)) {
        overlaps.push({ a: logical[i].id, b: logical[j].id });
      }
    }
  }
  // Power BI dashboards are not web pages  -  they're meant to be information-
  // dense, and a well-designed report routinely covers 70–90% of the canvas
  // with data visualisations. Thresholds below reflect that reality:
  //   - Low (default): up to ~12 data visuals, density ≤ 90%, ≤ 1 overlap
  //   - Medium: 13–18 visuals OR density 90–95% OR 2–4 overlaps
  //   - High:  > 18 visuals OR density > 95% OR > 4 overlaps
  let score: ClutterResult["score"] = "Low";
  if (logical.length > 18 || density > 0.95 || overlaps.length > 4) score = "High";
  else if (logical.length > 12 || density > 0.9 || overlaps.length > 1) score = "Medium";
  return {
    visualCount: logical.length,
    rawVisualCount: boxes.length,
    groupedCardCount: grouped,
    totalArea,
    canvasArea,
    density,
    overlaps,
    score,
  };
}
