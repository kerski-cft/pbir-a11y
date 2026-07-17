// APCA 0.1.9  -  Lc calculation (W3C/WCAG 3 working draft).
// Implementation adapted from the public-domain SAPC/APCA reference
// (Andrew Somers, Myndex Research). Constants match APCA-W3 0.1.9.
// Returns Lc in the range roughly -108..+106. Sign indicates polarity:
//   negative Lc = light text on dark background
//   positive Lc = dark text on light background

import { parseColor } from "./contrastUtils";

// APCA exponents
const mainTRC = 2.4;
const Rco = 0.2126729;
const Gco = 0.7151522;
const Bco = 0.0721750;

const normBG = 0.56;
const normTXT = 0.57;
const revTXT = 0.62;
const revBG = 0.65;

const blkThrs = 0.022;
const blkClmp = 1.414;
const scaleBoW = 1.14;
const scaleWoB = 1.14;
const loBoWoffset = 0.027;
const loWoBoffset = 0.027;
const deltaYmin = 0.0005;
const loClip = 0.1;

function sRGBtoY(rgb: { r: number; g: number; b: number }) {
  const r = Math.pow(rgb.r / 255, mainTRC);
  const g = Math.pow(rgb.g / 255, mainTRC);
  const b = Math.pow(rgb.b / 255, mainTRC);
  return Rco * r + Gco * g + Bco * b;
}

export function apcaContrast(textHex: string, bgHex: string): number | null {
  const t = parseColor(textHex);
  const b = parseColor(bgHex);
  if (!t || !b) return null;

  let txtY = sRGBtoY(t);
  let bgY = sRGBtoY(b);

  // Soft black clamp
  if (txtY < blkThrs) txtY += Math.pow(blkThrs - txtY, blkClmp);
  if (bgY < blkThrs) bgY += Math.pow(blkThrs - bgY, blkClmp);

  if (Math.abs(bgY - txtY) < deltaYmin) return 0;

  let SAPC = 0;
  let outputContrast = 0;

  if (bgY > txtY) {
    // Normal polarity: dark text on light bg
    SAPC = (Math.pow(bgY, normBG) - Math.pow(txtY, normTXT)) * scaleBoW;
    outputContrast = SAPC < loClip ? 0 : SAPC - loBoWoffset;
  } else {
    // Reverse polarity: light text on dark bg
    SAPC = (Math.pow(bgY, revBG) - Math.pow(txtY, revTXT)) * scaleWoB;
    outputContrast = SAPC > -loClip ? 0 : SAPC + loWoBoffset;
  }

  return Math.round(outputContrast * 100 * 10) / 10; // Lc to 1 decimal
}

// Map font-size (px) + weight to a guidance label per APCA "Bronze Simple"
// font-size lookup. Conservative/simplified mapping.
export interface ApcaGuidance {
  level: "fail" | "minimum" | "good" | "excellent";
  label: string;
  detail: string;
}

export function apcaGuidance(lc: number, fontPx: number, weight: 400 | 700): ApcaGuidance {
  const absLc = Math.abs(lc);
  // Simplified APCA font-size lookup (Bronze, body text):
  //   Lc 90+  : excellent, body text down to 14px works
  //   Lc 75   : good for body text 16px+ regular / 14px bold
  //   Lc 60   : minimum for body text 18px+ bold or 24px+ regular
  //   Lc 45   : large/headline only (24px+ bold / 36px+ regular)
  //   Lc <45  : not for body content
  //   Lc <30  : non-text only (icons, separators)
  //   Lc <15  : insufficient even for non-text
  const requiredLc = requiredLcFor(fontPx, weight);

  if (absLc < 15) {
    return {
      level: "fail",
      label: "Insufficient",
      detail: "Below APCA Lc 15  -  not enough contrast for any meaningful UI element.",
    };
  }
  const fontPt = Math.round((fontPx / (4 / 3)) * 10) / 10;
  if (absLc < requiredLc) {
    return {
      level: "fail",
      label: "Below recommended",
      detail: `APCA recommends roughly Lc ${requiredLc}+ for ${fontPt}pt (${fontPx}px) ${weight === 700 ? "bold" : "regular"} text. You have Lc ${absLc.toFixed(1)}.`,
    };
  }
  if (absLc < requiredLc + 15) {
    return {
      level: "minimum",
      label: "Meets minimum",
      detail: `Acceptable for ${fontPt}pt (${fontPx}px) ${weight === 700 ? "bold" : "regular"} body text. More headroom is recommended for long reading.`,
    };
  }
  if (absLc < 85) {
    return {
      level: "good",
      label: "Good",
      detail: "Comfortable for body text and UI labels at this size and weight.",
    };
  }
  return {
    level: "excellent",
    label: "Excellent",
    detail: "Strong contrast suitable for any text size and weight, including small body copy.",
  };
}

// Approximate "required Lc" per APCA Bronze body-text lookup
export function requiredLcFor(fontPx: number, weight: 400 | 700): number {
  if (weight === 700) {
    if (fontPx >= 24) return 45;
    if (fontPx >= 18) return 60;
    if (fontPx >= 16) return 70;
    if (fontPx >= 14) return 75;
    if (fontPx >= 12) return 90;
    return 100;
  }
  // Regular weight
  if (fontPx >= 36) return 45;
  if (fontPx >= 24) return 60;
  if (fontPx >= 18) return 70;
  if (fontPx >= 16) return 75;
  if (fontPx >= 14) return 90;
  return 100;
}
