// Font scaling rule based on the Smart Frames blog (Apr 2026).
// Baseline: 12pt minimum at 1280×720. Scales proportionally with canvas diagonal
// so fonts remain legible on larger canvases (e.g. 1920×1080, 4K).

const BASE_W = 1280;
const BASE_H = 720;
const BASE_MIN_PT = 12;
const BASE_DIAG = Math.hypot(BASE_W, BASE_H);

export function minFontPt(canvasW: number, canvasH: number): number {
  if (!canvasW || !canvasH) return BASE_MIN_PT;
  const diag = Math.hypot(canvasW, canvasH);
  const scaled = BASE_MIN_PT * (diag / BASE_DIAG);
  // Round up to nearest 0.5pt, never below baseline.
  return Math.max(BASE_MIN_PT, Math.round(scaled * 2) / 2);
}

export function evaluateFontSize(pt: number | null | undefined, canvasW: number, canvasH: number) {
  if (pt == null || Number.isNaN(pt)) return { ok: true, required: minFontPt(canvasW, canvasH), actual: null };
  const required = minFontPt(canvasW, canvasH);
  return { ok: pt >= required, required, actual: pt };
}
