// Colour-blindness simulation (Machado et al. 2009 matrices for anomalous
// trichromacies/dichromacies; achromatopsia uses luminance). Approximations
// suitable for distinguishability checks and per-pixel image previews.

import { parseColor, rgbToHex } from "./contrastUtils";

// All 7 commonly recognised types of colour blindness.
export type CVDType =
  | "protanopia"      // no red cones
  | "protanomaly"     // weak red cones
  | "deuteranopia"    // no green cones
  | "deuteranomaly"   // weak green cones
  | "tritanopia"      // no blue cones
  | "tritanomaly"     // weak blue cones
  | "achromatopsia";  // total colour blindness (monochromacy)

export const CVD_TYPES: { id: CVDType; label: string; description: string; prevalence: string }[] = [
  { id: "protanopia",    label: "Protanopia",    description: "No functioning red (L) cones  -  reds appear dark, reds and greens are confused.", prevalence: "≈1% of men" },
  { id: "protanomaly",   label: "Protanomaly",   description: "Reduced sensitivity to red light  -  milder red/green confusion.", prevalence: "≈1% of men" },
  { id: "deuteranopia",  label: "Deuteranopia",  description: "No functioning green (M) cones  -  strong red/green confusion.", prevalence: "≈1% of men" },
  { id: "deuteranomaly", label: "Deuteranomaly", description: "Reduced sensitivity to green light  -  the most common form of colour blindness.", prevalence: "≈5% of men" },
  { id: "tritanopia",    label: "Tritanopia",    description: "No functioning blue (S) cones  -  blues and yellows are confused.", prevalence: "<0.01%" },
  { id: "tritanomaly",   label: "Tritanomaly",   description: "Reduced sensitivity to blue light  -  milder blue/yellow confusion.", prevalence: "<0.01%" },
  { id: "achromatopsia", label: "Achromatopsia", description: "Total colour blindness  -  only luminance is perceived.", prevalence: "≈1 in 30,000" },
];

// Severity-1.0 dichromacy + severity-0.6 anomalous-trichromacy matrices
// (Machado, Oliveira & Fernandes 2009). Rows are R',G',B' applied to sRGB.
const matrices: Record<Exclude<CVDType, "achromatopsia">, number[]> = {
  protanopia:    [0.152, 1.053, -0.205, 0.115, 0.786, 0.099, -0.004, -0.048, 1.052],
  protanomaly:   [0.458, 0.620, -0.078, 0.268, 0.659, 0.073, -0.004, 0.022, 0.982],
  deuteranopia:  [0.367, 0.861, -0.228, 0.280, 0.673, 0.047, -0.012, 0.043, 0.969],
  deuteranomaly: [0.547, 0.607, -0.154, 0.353, 0.582, 0.065, -0.008, 0.034, 0.974],
  tritanopia:    [1.255, -0.077, -0.178, -0.078, 0.931, 0.148, 0.005, 0.691, 0.304],
  tritanomaly:   [1.193, -0.018, -0.175, -0.029, 0.968, 0.061, 0.005, 0.351, 0.643],
};

function applyMatrix(r: number, g: number, b: number, m: number[]) {
  const nr = Math.max(0, Math.min(255, Math.round(r * m[0] + g * m[1] + b * m[2])));
  const ng = Math.max(0, Math.min(255, Math.round(r * m[3] + g * m[4] + b * m[5])));
  const nb = Math.max(0, Math.min(255, Math.round(r * m[6] + g * m[7] + b * m[8])));
  return { r: nr, g: ng, b: nb };
}

export function simulate(hex: string, type: CVDType): string | null {
  const c = parseColor(hex);
  if (!c) return null;
  if (type === "achromatopsia") {
    // Rec. 709 luma  -  drop chroma entirely.
    const y = Math.round(0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b);
    return rgbToHex({ r: y, g: y, b: y });
  }
  return rgbToHex(applyMatrix(c.r, c.g, c.b, matrices[type]));
}

// Per-pixel simulation for an ImageData buffer (used by the image simulator).
export function simulateImageData(src: ImageData, type: CVDType): ImageData {
  const out = new ImageData(new Uint8ClampedArray(src.data), src.width, src.height);
  const data = out.data;
  if (type === "achromatopsia") {
    for (let i = 0; i < data.length; i += 4) {
      const y = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      data[i] = data[i + 1] = data[i + 2] = y;
    }
    return out;
  }
  const m = matrices[type];
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const nr = r * m[0] + g * m[1] + b * m[2];
    const ng = r * m[3] + g * m[4] + b * m[5];
    const nb = r * m[6] + g * m[7] + b * m[8];
    data[i]     = nr < 0 ? 0 : nr > 255 ? 255 : nr;
    data[i + 1] = ng < 0 ? 0 : ng > 255 ? 255 : ng;
    data[i + 2] = nb < 0 ? 0 : nb > 255 ? 255 : nb;
  }
  return out;
}

// Perceptual distance in simple Lab-ish space (CIE76 over linearized RGB).
function dist(a: string, b: string) {
  const ca = parseColor(a)!;
  const cb = parseColor(b)!;
  const dr = ca.r - cb.r;
  const dg = ca.g - cb.g;
  const db = ca.b - cb.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

export interface CVDPair {
  a: string;
  b: string;
  type: CVDType;
  originalDistance: number;
  simulatedDistance: number;
  collision: boolean;
}

export function findCollisions(palette: string[]): CVDPair[] {
  const out: CVDPair[] = [];
  // Only the dichromacy types are used for the analyser collision check  - 
  // they represent the worst case for each axis.
  const types: CVDType[] = ["protanopia", "deuteranopia", "tritanopia"];
  const unique = Array.from(new Set(palette.filter(Boolean)));
  for (let i = 0; i < unique.length; i++) {
    for (let j = i + 1; j < unique.length; j++) {
      const a = unique[i];
      const b = unique[j];
      const orig = dist(a, b);
      if (orig < 25) continue; // already similar  -  not a CVD failure mode
      for (const t of types) {
        const sa = simulate(a, t);
        const sb = simulate(b, t);
        if (!sa || !sb) continue;
        const sim = dist(sa, sb);
        const collision = sim < 25 && orig - sim > 30;
        if (collision) {
          out.push({ a, b, type: t, originalDistance: Math.round(orig), simulatedDistance: Math.round(sim), collision });
        }
      }
    }
  }
  return out;
}

// NOTE: a previous version of this file exposed `detectRAG` /
// `detectRAGFromStrings` to flag red/amber/green palettes from the static
// PBIX layout JSON. We removed those exports because PBIX colour storage is
// far too varied (themes, conditional formatting, on-object overrides) to
// reliably reproduce the *rendered* palette without running the report.
// We now surface a UI recommendation to run the visual through the
// Colour Blindness Simulator instead  -  the only reliable verification.
