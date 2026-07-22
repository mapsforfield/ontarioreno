// ─── Brand colour derivation ─────────────────────────────────────────────────
//
// A contractor's agreement should carry their colour, not the colour the
// template happened to be authored in — Reno Chefs' paperwork reading in
// Harbor's teal looks like a template they were assigned rather than their own
// document.
//
// The raw logo colour is rarely usable as-is. A bright orange or yellow set as
// heading text on white is unreadable, and the same colour used as a filled
// band with white text on it is unreadable the other way. So we sample the
// logo for its dominant *hue*, then derive a tone dark enough to satisfy both
// uses at once: contrast >= 4.5:1 against white means text in that colour reads
// on a white page, and white text reads on a fill of that colour.

export type RGB = [number, number, number];

// ── Colour space helpers ─────────────────────────────────────────────────────

function toLinear(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance. */
export function luminance([r, g, b]: RGB): number {
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** WCAG contrast ratio against white. */
export function contrastOnWhite(rgb: RGB): number {
  return 1.05 / (luminance(rgb) + 0.05);
}

function rgbToHsl([r, g, b]: RGB): [number, number, number] {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): RGB {
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue = (t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  return [
    Math.round(hue(h + 1 / 3) * 255),
    Math.round(hue(h) * 255),
    Math.round(hue(h - 1 / 3) * 255),
  ];
}

/**
 * Darken a colour until it reaches `target` contrast against white, keeping its
 * hue and saturation. This is what makes a yellow or light-orange brand usable
 * for text without turning it grey.
 */
export function darkenToContrast(rgb: RGB, target: number): RGB {
  const [h, s] = rgbToHsl(rgb);
  let [, , l] = rgbToHsl(rgb);
  let out = rgb;
  // Walk lightness down in small steps; 60 iterations covers the full range.
  for (let i = 0; i < 60 && contrastOnWhite(out) < target; i += 1) {
    l = Math.max(0, l - 0.015);
    out = hslToRgb(h, Math.min(1, s * 1.02), l);
  }
  return out;
}

/** A very light wash of the accent, for callout backgrounds behind dark text. */
export function tintOf(rgb: RGB, amount = 0.92): RGB {
  return [
    Math.round(rgb[0] + (255 - rgb[0]) * amount),
    Math.round(rgb[1] + (255 - rgb[1]) * amount),
    Math.round(rgb[2] + (255 - rgb[2]) * amount),
  ];
}

// ── Extraction ───────────────────────────────────────────────────────────────

/**
 * Find the dominant branded hue in a logo.
 *
 * Greys, near-white and near-black are ignored — most logos sit on a white
 * field with black wordmark, and neither is the brand colour. Remaining pixels
 * are bucketed by hue and weighted by saturation, so a small vivid mark beats a
 * large washed-out background.
 *
 * Returns null for logos with no chromatic content (pure black/white marks),
 * in which case the caller keeps the template's own accent.
 */
export function extractBrandColor(dataUrl: string): Promise<RGB | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const SIZE = 72; // plenty for a hue histogram, and fast
        const canvas = document.createElement('canvas');
        canvas.width = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) { resolve(null); return; }
        ctx.drawImage(img, 0, 0, SIZE, SIZE);
        const { data } = ctx.getImageData(0, 0, SIZE, SIZE);

        const BUCKETS = 24;
        const weight = new Array<number>(BUCKETS).fill(0);
        const sums: Array<[number, number, number]> = Array.from({ length: BUCKETS }, () => [0, 0, 0]);

        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3];
          if (a < 128) continue;
          const rgb: RGB = [data[i], data[i + 1], data[i + 2]];
          const [h, s, l] = rgbToHsl(rgb);
          if (s < 0.18 || l < 0.12 || l > 0.92) continue; // grey / white / black
          const b = Math.min(BUCKETS - 1, Math.floor(h * BUCKETS));
          const w = s * (1 - Math.abs(l - 0.5)); // favour vivid, mid-lightness
          weight[b] += w;
          sums[b][0] += rgb[0] * w;
          sums[b][1] += rgb[1] * w;
          sums[b][2] += rgb[2] * w;
        }

        let best = -1;
        let bestW = 0;
        for (let b = 0; b < BUCKETS; b += 1) {
          if (weight[b] > bestW) { bestW = weight[b]; best = b; }
        }
        if (best === -1 || bestW <= 0) { resolve(null); return; }
        resolve([
          Math.round(sums[best][0] / weight[best]),
          Math.round(sums[best][1] / weight[best]),
          Math.round(sums[best][2] / weight[best]),
        ]);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

export type AccentChoice = 'brand' | 'deep' | 'default';

export type AccentOption = {
  key: AccentChoice;
  label: string;
  /** null means "use whatever the template was authored with". */
  value: RGB | null;
};

/**
 * The palette offered to the rep. Brand tones are only present when a colour
 * could actually be read off the logo.
 */
export function accentOptions(brand: RGB | null): AccentOption[] {
  const options: AccentOption[] = [];
  if (brand) {
    // 4.5:1 keeps it legible as text on white *and* as a fill under white text.
    options.push({ key: 'brand', label: 'Brand', value: darkenToContrast(brand, 4.5) });
    options.push({ key: 'deep', label: 'Brand deep', value: darkenToContrast(brand, 9) });
  }
  options.push({ key: 'default', label: 'Template', value: null });
  return options;
}
