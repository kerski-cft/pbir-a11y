// Find nearest passing colour by adjusting HSL lightness while keeping hue/saturation.
// Used by the Colour Contrast Checker for "nearest passing fg/bg" suggestions.

import { contrastRatio, parseColor, rgbToHex } from "./contrastUtils";

function rgbToHsl(r: number, g: number, b: number) {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)); break;
      case gn: h = ((bn - rn) / d + 2); break;
      default: h = ((rn - gn) / d + 4); break;
    }
    h /= 6;
  }
  return { h, s, l };
}

function hslToRgb(h: number, s: number, l: number) {
  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hk = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return {
    r: Math.round(hk(h + 1 / 3) * 255),
    g: Math.round(hk(h) * 255),
    b: Math.round(hk(h - 1 / 3) * 255),
  };
}

export function nearestPassing(
  changing: string,
  fixed: string,
  target: number,
  role: "fg" | "bg",
): string | null {
  const c = parseColor(changing);
  if (!c) return null;
  const { h, s, l: l0 } = rgbToHsl(c.r, c.g, c.b);

  // Try lightness deltas in both directions in 0.01 steps; prefer smaller delta.
  for (let step = 1; step <= 100; step += 1) {
    for (const dir of [-1, 1]) {
      const l = Math.max(0, Math.min(1, l0 + (step / 100) * dir));
      const rgb = hslToRgb(h, s, l);
      const hex = rgbToHex(rgb);
      const a = role === "fg" ? hex : fixed;
      const b = role === "fg" ? fixed : hex;
      const ratio = contrastRatio(a, b);
      if (ratio != null && ratio >= target) return hex;
      if (l === 0 || l === 1) continue;
    }
  }
  return null;
}
