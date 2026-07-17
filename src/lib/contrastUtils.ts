// WCAG contrast utilities

export function parseColor(input: string | null | undefined): { r: number; g: number; b: number; a: number } | null {
  if (!input) return null;
  const s = String(input).trim();
  if (!s) return null;

  // #rgb / #rgba / #rrggbb / #rrggbbaa
  const hex = s.match(/^#?([0-9a-f]{3,8})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    if (h.length === 4) h = h.split("").map((c) => c + c).join("");
    if (h.length === 6) return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: 1 };
    if (h.length === 8)
      return {
        r: parseInt(h.slice(0, 2), 16),
        g: parseInt(h.slice(2, 4), 16),
        b: parseInt(h.slice(4, 6), 16),
        a: parseInt(h.slice(6, 8), 16) / 255,
      };
  }
  // rgb()/rgba()
  const rgb = s.match(/rgba?\(([^)]+)\)/i);
  if (rgb) {
    const parts = rgb[1].split(/[,\s/]+/).filter(Boolean);
    if (parts.length >= 3) {
      return {
        r: clamp255(parseFloat(parts[0])),
        g: clamp255(parseFloat(parts[1])),
        b: clamp255(parseFloat(parts[2])),
        a: parts[3] !== undefined ? Math.max(0, Math.min(1, parseFloat(parts[3]))) : 1,
      };
    }
  }
  return null;
}

function clamp255(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(255, Math.round(n)));
}

export function rgbToHex({ r, g, b }: { r: number; g: number; b: number }) {
  const h = (n: number) => n.toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`.toUpperCase();
}

function srgbChannelToLinear(c: number) {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(rgb: { r: number; g: number; b: number }) {
  const r = srgbChannelToLinear(rgb.r);
  const g = srgbChannelToLinear(rgb.g);
  const b = srgbChannelToLinear(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(fg: string, bg: string): number | null {
  const f = parseColor(fg);
  const b = parseColor(bg);
  if (!f || !b) return null;
  const L1 = relativeLuminance(f);
  const L2 = relativeLuminance(b);
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}

export interface ContrastVerdict {
  ratio: number;
  passAA: boolean;
  passAAA: boolean;
  passAALarge: boolean;
  level: "fail" | "AA-large" | "AA" | "AAA";
}

export function evaluateContrast(fg: string, bg: string, isLargeText = false): ContrastVerdict | null {
  const r = contrastRatio(fg, bg);
  if (r == null) return null;
  const passAALarge = r >= 3;
  const passAA = isLargeText ? r >= 3 : r >= 4.5;
  const passAAA = isLargeText ? r >= 4.5 : r >= 7;
  let level: ContrastVerdict["level"] = "fail";
  if (passAAA) level = "AAA";
  else if (passAA) level = "AA";
  else if (passAALarge) level = "AA-large";
  return { ratio: Math.round(r * 100) / 100, passAA, passAAA, passAALarge, level };
}
