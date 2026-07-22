// ─── Sales Agreement PDF renderer ────────────────────────────────────────────
//
// A small layout engine over jsPDF. Everything a template can vary — typeface,
// masthead, title treatment, heading numbering, bullet glyph, scope-table
// styling, signature block, footer — is a switch driven by the TemplateSpec, so
// two contractors' agreements are structurally different documents rather than
// the same document with a different logo.
//
// Everything renders client-side. The finished blob goes up through the existing
// deal-agreement upload path, so this adds no serverless functions.

import { jsPDF } from 'jspdf';
import type { RGB, SectionKey, TemplateSpec } from '../data/contractTemplates';
import { getTemplate } from '../data/contractTemplates';
import { contractFontsReady } from './contractFonts';
import { tintOf } from './brandColor';
import type { ScopeLine } from '../data/scopePresets';

const PAGE_W = 612;
const PAGE_H = 792;

export type PaymentMethod = 'financing' | 'cash' | 'both';

export type ContractData = {
  /** YYYY/MM/DD — the agreement date. */
  agreementDate: string;
  contractorName: string;
  contractorAddress1: string;
  contractorAddress2: string;
  contractorPhone: string;
  contractorEmail: string;
  contractorWebsite: string;
  /** Who signs for the contractor. */
  contractorSignatory: string;
  /** Data URL, drawn into the masthead when the template has room for it. */
  logoDataUrl: string | null;

  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  /** The property the work is performed at. */
  propertyAddress: string;

  startDate: string;
  completionDate: string;

  totalPrice: number;
  /** e.g. '+ HST' — appended after the price. */
  taxNote: string;

  paymentMethod: PaymentMethod;
  financeRate: string;
  financeTermMonths: string;
  financeAmortMonths: string;
  financeMonthlyPayment: string;
  financeUpfrontPct: string;
  /** Cash schedule — percentage plus the milestone it's due at. */
  cashSchedule: Array<{ pct: string; when: string }>;

  scope: ScopeLine[];
  /** Free-text clause appended after the scope (special arrangements etc.). */
  specialTerms: string;

  templateId: string;
  /** Contractor brand colour chosen by the rep; null keeps the template's own. */
  accentOverride?: [number, number, number] | null;
};

// ── Small helpers ────────────────────────────────────────────────────────────

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV'];
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function money(v: number): string {
  return `$${v.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Templates that speak in legal register vs plain English. */
function isFormal(t: TemplateSpec): boolean {
  return t.id === 'meridian' || t.id === 'sterling' || t.id === 'atlas';
}

/**
 * Fetch a logo and normalise it to a PNG data URL.
 *
 * We rasterise through a canvas rather than handing the raw bytes to jsPDF:
 * contractors upload whatever they have (JPEG, WebP, SVG), and jsPDF only
 * accepts a few formats — passing it a WebP silently throws. Going via the
 * browser's decoder means anything the browser can display, the PDF can embed.
 */
export async function loadImageAsDataUrl(url: string): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    return await rasterise(await res.blob());
  } catch {
    // Cross-origin or offline — the document renders fine without the logo.
    return null;
  }
}

/**
 * Decode a blob via the browser and re-encode it, capped at `max` px.
 *
 * Logos keep PNG for transparency. Scope photos go to JPEG — a rep shooting a
 * tile sample on their phone produces a multi-megabyte file, and the draft is
 * autosaved into localStorage, so photos have to come down hard or the whole
 * draft stops saving.
 */
function rasterise(blob: Blob, max = 512, mime: 'image/png' | 'image/jpeg' = 'image/png', quality = 0.82): Promise<string | null> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      try {
        const nw = img.naturalWidth || max;
        const nh = img.naturalHeight || max;
        const scale = Math.min(1, max / Math.max(nw, nh));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(nw * scale));
        canvas.height = Math.max(1, Math.round(nh * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(null); return; }
        if (mime === 'image/jpeg') {
          // JPEG has no alpha — flatten onto white so transparent PNGs don't
          // come out with a black background.
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL(mime, quality));
      } catch {
        resolve(null);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(null); };
    img.src = objectUrl;
  });
}

/** Prepare a rep-selected product photo for a scope line. */
export function prepareScopeImage(file: File): Promise<string | null> {
  return rasterise(file, 460, 'image/jpeg', 0.8);
}

/** jsPDF needs the format named explicitly; infer it from the data URL. */
function imageFormat(dataUrl: string): 'JPEG' | 'PNG' {
  return dataUrl.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG';
}

/**
 * Draw a logo letterboxed inside a box, preserving its aspect ratio, and report
 * the width actually used so the caller can set text beside it. Returns 0 when
 * there's nothing to draw — callers fall back to a text-only masthead.
 */
function drawLogo(doc: jsPDF, dataUrl: string | null, x: number, y: number, boxW: number, boxH: number): number {
  if (!dataUrl) return 0;
  try {
    const props = doc.getImageProperties(dataUrl);
    const scale = Math.min(boxW / props.width, boxH / props.height);
    const w = props.width * scale;
    const h = props.height * scale;
    // Centre vertically in the box; left-align so text gutters stay predictable.
    doc.addImage(dataUrl, imageFormat(dataUrl), x, y + (boxH - h) / 2, w, h);
    return w;
  } catch {
    return 0;
  }
}

// ── The layout engine ────────────────────────────────────────────────────────

class Layout {
  doc: jsPDF;
  t: TemplateSpec;
  y: number;
  /** Section counter, drives heading numbering. */
  private sectionNo = 0;

  /** The section currently being laid out — Sterling numbers sub-clauses off it. */
  get section() { return this.sectionNo; }

  constructor(t: TemplateSpec) {
    this.t = t;
    this.doc = new jsPDF({ unit: 'pt', format: 'letter' });
    this.y = t.margin.top;
  }

  get left() { return this.t.margin.left; }
  get right() { return PAGE_W - this.t.margin.right; }
  get width() { return this.right - this.left; }
  get bottom() { return PAGE_H - this.t.margin.bottom; }

  // ── Column flow ──
  // Body clauses can run in two columns (Harbor), which is one of the strongest
  // signals that two documents came from different firms. Page furniture —
  // masthead, scope table, signatures — always spans the full measure, so
  // `left`/`width` stay page-level and body copy uses `flowLeft`/`flowWidth`.
  private columns = 1;
  private col = 0;
  private readonly colGap = 24;
  /**
   * The y the current page's column flow starts at. On page one that sits below
   * the masthead and parties block, so wrapping into the second column must
   * return here — not to the page margin, which would run under the masthead.
   */
  private colTop = 0;

  get flowWidth() { return this.columns === 1 ? this.width : (this.width - this.colGap) / 2; }
  get flowLeft() { return this.left + this.col * (this.flowWidth + this.colGap); }

  /** Switch the body into `n` columns, starting a fresh flow at the top. */
  setColumns(n: 1 | 2) {
    if (n === this.columns) return;
    this.columns = n;
    this.col = 0;
    this.colTop = this.y;
  }

  /** Finish column flow and drop back to a full-measure single column. */
  endColumns() {
    if (this.columns === 1) return;
    this.columns = 1;
    this.col = 0;
  }

  /**
   * The typeface to actually set. The embedded faces live in a lazily-loaded
   * chunk; if it hasn't arrived (or failed), fall back to a built-in so the
   * document still renders rather than throwing.
   */
  get family(): string {
    return contractFontsReady() ? this.t.font : this.t.fontFallback;
  }

  ink(c: RGB = this.t.ink) { this.doc.setTextColor(c[0], c[1], c[2]); }
  stroke(c: RGB = this.t.rule) { this.doc.setDrawColor(c[0], c[1], c[2]); }
  fill(c: RGB) { this.doc.setFillColor(c[0], c[1], c[2]); }
  font(style: 'normal' | 'bold' | 'italic' = 'normal', size = this.t.bodySize) {
    // The embedded faces are subset to regular + bold to keep the chunk small,
    // so italic resolves to regular. Secondary text already reads as secondary
    // through colour, so nothing is lost.
    const resolved = style === 'italic' && contractFontsReady() ? 'normal' : style;
    this.doc.setFont(this.family, resolved);
    this.doc.setFontSize(size);
  }

  /** Break to the next column, or the next page, if `need` points won't fit. */
  ensure(need: number) {
    if (this.y + need <= this.bottom) return;
    if (this.columns === 2 && this.col === 0) {
      this.col = 1;
      this.y = this.colTop;
      return;
    }
    this.doc.addPage();
    this.col = 0;
    // A fresh page has no masthead above the flow, so columns start at the top.
    this.colTop = this.t.margin.top;
    this.y = this.colTop;
    this.runningHeader();
  }

  /** Light header repeated on continuation pages (page 1 gets the masthead). */
  runningHeader() {
    const t = this.t;
    if (t.header === 'rail') return; // Atlas keeps continuation pages bare.
    this.font('bold', 7.5);
    this.ink(t.muted);
    this.doc.text(t.id === 'meridian' ? 'HOME IMPROVEMENT SERVICE AGREEMENT' : 'Service Agreement', this.left, this.y - 22);
    this.stroke(t.rule);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.left, this.y - 15, this.right, this.y - 15);
  }

  /**
   * Letterspaced text, shrunk to fit `maxW`. Tracking multiplies the width of a
   * string by roughly 2x, so long headings overrun the page unless we scale the
   * size down to suit. Returns the size actually used.
   */
  tracked(text: string, x: number, y: number, maxW: number, size: number, align?: 'center') {
    const spaced = text.split('').join(' ');
    this.doc.setFontSize(size);
    const w = this.doc.getTextWidth(spaced);
    const fitted = w > maxW ? Math.max(6.5, (size * maxW) / w) : size;
    this.doc.setFontSize(fitted);
    this.doc.text(spaced, x, y, align === 'center' ? { align: 'center' } : undefined);
    return fitted;
  }

  /** Wrapped body text. Returns the height consumed. */
  para(text: string, opts: { indent?: number; size?: number; style?: 'normal' | 'bold' | 'italic'; gap?: number; color?: RGB } = {}) {
    const t = this.t;
    const size = opts.size ?? t.bodySize;
    const indent = opts.indent ?? 0;
    const lh = size * t.leading;
    this.font(opts.style ?? 'normal', size);
    const lines = this.doc.splitTextToSize(text, this.flowWidth - indent) as string[];
    lines.forEach((line) => {
      this.ensure(lh);
      this.ink(opts.color ?? t.ink);
      this.font(opts.style ?? 'normal', size);
      this.doc.text(line, this.flowLeft + indent, this.y + size * 0.85);
      this.y += lh;
    });
    this.y += opts.gap ?? size * 0.45;
  }

  /** One list item, drawn with the template's bullet treatment. */
  listItem(text: string, marker?: string) {
    const t = this.t;
    const size = t.bodySize;
    const lh = size * t.leading;
    const gutter = t.bullet === 'none' ? 0 : marker ? 24 : 16;
    this.font('normal', size);
    const lines = this.doc.splitTextToSize(text, this.flowWidth - gutter) as string[];

    lines.forEach((line, i) => {
      this.ensure(lh);
      const baseline = this.y + size * 0.85;
      if (i === 0 && t.bullet !== 'none') {
        if (marker) {
          // Sterling's numbered sub-clauses (1.1, 1.2 …).
          this.font('bold', size - 0.5);
          this.ink(t.accent);
          this.doc.text(marker, this.flowLeft, baseline);
        } else if (t.bullet === 'square') {
          this.fill(t.accent);
          this.doc.rect(this.flowLeft + 1, this.y + size * 0.32, 3.2, 3.2, 'F');
        } else if (t.bullet === 'arrow') {
          this.fill(t.accent);
          this.doc.triangle(
            this.flowLeft + 1, this.y + size * 0.22,
            this.flowLeft + 1, this.y + size * 0.66,
            this.flowLeft + 5.2, this.y + size * 0.44,
            'F',
          );
        } else {
          this.font('normal', size);
          this.ink(t.accent);
          this.doc.text(t.bullet === 'dash' ? '–' : '•', this.flowLeft + 1, baseline);
        }
      }
      this.ink(t.ink);
      this.font('normal', size);
      this.doc.text(line, this.flowLeft + gutter, baseline);
      this.y += lh;
    });
    this.y += size * 0.3;
  }

  /** A numbered/styled section heading, per the template's scheme. */
  heading(text: string) {
    const t = this.t;
    this.sectionNo += 1;
    const n = this.sectionNo;
    let label = '';
    if (t.numbering === 'roman') label = `${ROMAN[n - 1] ?? n}. `;
    else if (t.numbering === 'decimal') label = `${n}. `;
    else if (t.numbering === 'padded') label = `${String(n).padStart(2, '0')}  `;
    else if (t.numbering === 'lettered') label = `${LETTERS[(n - 1) % 26]}. `;

    const size = t.bodySize + (t.headingStyle === 'tracked-mini' ? -1.6 : 1.6);
    this.ensure(size * 3.2);
    this.y += t.bodySize * 0.7;

    switch (t.headingStyle) {
      case 'serif-caps-centered': {
        // Meridian: centred, letterspaced small caps, no rule.
        this.font('bold', size);
        this.ink(t.accent);
        this.tracked(`${label}${text.toUpperCase()}`, PAGE_W / 2, this.y + size, this.width, size, 'center');
        this.y += size * 1.9;
        break;
      }
      case 'accent-bar': {
        // Vertex: a short thick accent bar sitting left of the heading.
        this.fill(t.accent);
        this.doc.rect(this.flowLeft, this.y + 2, 3, size + 2, 'F');
        this.font('bold', size);
        this.ink(t.accent);
        this.doc.text(`${label}${text}`, this.flowLeft + 11, this.y + size);
        this.y += size * 1.75;
        break;
      }
      case 'tracked-mini': {
        // Atlas: tiny tracked label out in the left rail, body stays in place.
        this.font('bold', size);
        this.ink(t.accent);
        const caps = text.toUpperCase();
        const spaced = caps.split('').join(' ');
        this.doc.text(this.doc.getTextWidth(spaced) <= 96 ? spaced : caps, t.margin.left - 108, this.y + size, { maxWidth: 96 });
        this.y += size * 0.6;
        break;
      }
      case 'rule-under': {
        // Sterling: heading over a full-width hairline.
        this.font('bold', size);
        this.ink(t.accent);
        this.doc.text(`${label}${text.toUpperCase()}`, this.flowLeft, this.y + size);
        this.y += size * 1.35;
        this.stroke(t.rule);
        this.doc.setLineWidth(0.7);
        this.doc.line(this.flowLeft, this.y, this.flowLeft + this.flowWidth, this.y);
        this.y += size * 0.75;
        break;
      }
      case 'side-tab': {
        // Harbor: heading sitting in a tinted rounded tab.
        const txt = `${label}${text}`;
        this.font('bold', size);
        const w = Math.min(this.doc.getTextWidth(txt) + 18, this.flowWidth);
        this.fill(t.tint);
        this.doc.roundedRect(this.flowLeft - 6, this.y, w, size + 9, 3, 3, 'F');
        this.ink(t.accent);
        this.doc.text(txt, this.flowLeft + 3, this.y + size + 1.5);
        this.y += size * 2.1;
        break;
      }
    }
  }

  /** Horizontal rule at the current position. */
  rule(weight = 0.6, color: RGB = this.t.rule) {
    this.ensure(6);
    this.stroke(color);
    this.doc.setLineWidth(weight);
    this.doc.line(this.left, this.y, this.right, this.y);
    this.y += 6;
  }

  gap(h: number) { this.y += h; }
}

// ── Cover pages ──────────────────────────────────────────────────────────────

/** Draw the template's cover, if it has one. Returns true if a page was used. */
function drawCover(L: Layout, d: ContractData): boolean {
  const t = L.t;
  const doc = L.doc;
  if (t.cover === 'none') return false;

  if (t.cover === 'brand-block') {
    // Vertex — a confident, brand-forward cover: full-bleed accent field, the
    // project and the price stated plainly. Reads like a proposal cover.
    L.fill(t.accent);
    doc.rect(0, 0, PAGE_W, 340, 'F');

    const logoW = drawLogo(doc, d.logoDataUrl, L.left, 60, 150, 56);
    doc.setTextColor(255, 255, 255);
    L.font('bold', 26);
    const nameLines = doc.splitTextToSize(d.contractorName, L.width) as string[];
    let cy = 60 + (logoW ? 76 : 0) + 30;
    nameLines.forEach((line) => { doc.text(line, L.left, cy); cy += 30; });

    L.font('normal', 11);
    doc.text('HOME IMPROVEMENT SERVICE AGREEMENT', L.left, cy + 8);

    // Below the field: the particulars, set large and calm.
    let by = 400;
    const row = (label: string, value: string) => {
      if (!value) return;
      L.font('bold', 8);
      L.ink(t.muted);
      doc.text(label.toUpperCase(), L.left, by);
      L.font('normal', 13);
      L.ink(t.ink);
      const lines = doc.splitTextToSize(value, L.width) as string[];
      lines.forEach((line, i) => doc.text(line, L.left, by + 19 + i * 17));
      by += 19 + lines.length * 17 + 22;
    };
    row('Prepared for', d.ownerName);
    row('Property', d.propertyAddress);
    row('Agreement date', d.agreementDate);

    L.stroke(t.rule);
    doc.setLineWidth(0.8);
    doc.line(L.left, by + 2, L.right, by + 2);
    L.font('bold', 8);
    L.ink(t.muted);
    doc.text('TOTAL PRICE', L.left, by + 26);
    L.font('bold', 24);
    L.ink(t.accent);
    doc.text(`${money(d.totalPrice)}${d.taxNote ? ` ${d.taxNote}` : ''}`, L.left, by + 50);

    doc.addPage();
    L.y = t.margin.top;
    return true;
  }

  // Sterling — an institutional cover: centred title inside a ruled frame with
  // a document-control table beneath. Reads like a contract from a large firm.
  L.stroke(t.accent);
  doc.setLineWidth(1.4);
  doc.rect(46, 46, PAGE_W - 92, PAGE_H - 92);
  doc.setLineWidth(0.5);
  doc.rect(54, 54, PAGE_W - 108, PAGE_H - 108);

  const logoW = drawLogo(doc, d.logoDataUrl, (PAGE_W - 130) / 2, 130, 130, 54);
  L.font('bold', 17);
  L.ink(t.accent);
  doc.text(d.contractorName, PAGE_W / 2, logoW ? 232 : 200, { align: 'center', maxWidth: PAGE_W - 160 });

  L.stroke(t.rule);
  doc.setLineWidth(0.6);
  doc.line(160, 268, PAGE_W - 160, 268);

  L.font('bold', 15);
  L.ink(t.ink);
  doc.text('HOME IMPROVEMENT', PAGE_W / 2, 316, { align: 'center' });
  doc.text('SERVICE AGREEMENT', PAGE_W / 2, 338, { align: 'center' });

  // Document-control block — the detail that makes it read as institutional.
  const bx = 118;
  const bw = PAGE_W - 236;
  let by = 420;
  L.font('bold', 8);
  L.ink(t.muted);
  doc.text('DOCUMENT CONTROL', bx, by);
  by += 10;
  L.stroke(t.rule);
  doc.setLineWidth(0.7);
  doc.line(bx, by, bx + bw, by);
  by += 6;

  const ctrl: Array<[string, string]> = [
    ['Owner', d.ownerName || '—'],
    ['Property', d.propertyAddress || '—'],
    ['Agreement date', d.agreementDate],
    ['Commencement', d.startDate || '—'],
    ['Completion', d.completionDate || '—'],
    ['Contract price', `${money(d.totalPrice)}${d.taxNote ? ` ${d.taxNote}` : ''}`],
  ];
  ctrl.forEach(([k, v]) => {
    L.font('normal', 8.5);
    L.ink(t.muted);
    doc.text(k.toUpperCase(), bx, by + 11);
    L.font('bold', 9.5);
    L.ink(t.ink);
    const lines = doc.splitTextToSize(v, bw - 140) as string[];
    lines.forEach((line, i) => doc.text(line, bx + 140, by + 11 + i * 12));
    by += Math.max(1, lines.length) * 12 + 8;
    L.stroke([230, 234, 240]);
    doc.setLineWidth(0.4);
    doc.line(bx, by - 3, bx + bw, by - 3);
  });

  L.font('normal', 7.5);
  L.ink(t.muted);
  doc.text('This document contains the full terms of agreement between the parties named above.',
    PAGE_W / 2, PAGE_H - 96, { align: 'center' });

  doc.addPage();
  L.y = t.margin.top;
  return true;
}

// ── Masthead ─────────────────────────────────────────────────────────────────

function drawMasthead(L: Layout, d: ContractData) {
  const t = L.t;
  const doc = L.doc;
  const addr = [d.contractorAddress1, d.contractorAddress2].filter(Boolean);
  const contact = [d.contractorPhone && `Tel ${d.contractorPhone}`, d.contractorEmail, d.contractorWebsite]
    .filter(Boolean)
    .join('   ·   ');

  switch (t.header) {
    case 'stacked-serif': {
      // Meridian — centred serif letterhead, hairline beneath. The mark sits
      // centred above the company name, the way an engraved letterhead reads.
      if (d.logoDataUrl) {
        try {
          const props = doc.getImageProperties(d.logoDataUrl);
          const scale = Math.min(112 / props.width, 44 / props.height);
          const w = props.width * scale;
          const h = props.height * scale;
          doc.addImage(d.logoDataUrl, 'PNG', (PAGE_W - w) / 2, L.y, w, h);
          L.y += h + 12;
        } catch { /* text-only letterhead */ }
      }
      L.font('bold', 15);
      L.ink(t.accent);
      doc.text(d.contractorName, PAGE_W / 2, L.y + 14, { align: 'center' });
      L.y += 26;
      L.font('normal', 8.6);
      L.ink(t.muted);
      addr.forEach((line) => {
        doc.text(line, PAGE_W / 2, L.y + 8, { align: 'center' });
        L.y += 11;
      });
      if (contact) {
        doc.text(contact, PAGE_W / 2, L.y + 8, { align: 'center' });
        L.y += 11;
      }
      L.y += 6;
      L.stroke(t.rule);
      doc.setLineWidth(0.8);
      doc.line(L.left + 60, L.y, L.right - 60, L.y);
      L.y += 22;
      break;
    }
    case 'band': {
      // Vertex — full-bleed accent band with logo and contact reversed out.
      L.fill(t.accent);
      doc.rect(0, 0, PAGE_W, 92, 'F');
      const bandLogoW = drawLogo(doc, d.logoDataUrl, L.left, 22, 56, 48);
      const textX = bandLogoW ? L.left + bandLogoW + 14 : L.left;
      doc.setTextColor(255, 255, 255);
      L.font('bold', 17);
      doc.text(d.contractorName, textX, 44);
      L.font('normal', 8.4);
      doc.text(addr.join(', '), textX, 60);
      if (contact) doc.text(contact, textX, 73);
      L.y = 120;
      break;
    }
    case 'rail': {
      // Atlas — company set small in the left rail, nothing across the top.
      // The rail is narrow, so every block is measured before it's drawn:
      // a two-line company name must push the address down, not sit under it.
      const railX = t.margin.left - 108;
      const railW = 96;
      let ry = L.y + 9;
      // The mark leads the rail, sized to the rail width rather than a square.
      const railLogoH = (() => {
        if (!d.logoDataUrl) return 0;
        try {
          const props = doc.getImageProperties(d.logoDataUrl);
          const scale = Math.min(railW / props.width, 40 / props.height);
          const w = props.width * scale;
          const h = props.height * scale;
          doc.addImage(d.logoDataUrl, 'PNG', railX, L.y, w, h);
          return h + 12;
        } catch {
          return 0;
        }
      })();
      ry += railLogoH;
      L.font('bold', 9);
      L.ink(t.ink);
      const nameLines = doc.splitTextToSize(d.contractorName, railW) as string[];
      nameLines.forEach((line) => { doc.text(line, railX, ry); ry += 10.5; });
      ry += 5;
      L.font('normal', 6.8);
      L.ink(t.muted);
      [...addr, d.contractorPhone, d.contractorEmail, d.contractorWebsite]
        .filter(Boolean)
        .forEach((entry) => {
          (doc.splitTextToSize(entry as string, railW) as string[]).forEach((line) => {
            doc.text(line, railX, ry);
            ry += 8.4;
          });
          ry += 1.5;
        });
      break;
    }
    case 'boxed': {
      // Sterling — bordered masthead box, name left, particulars right.
      const boxH = 78;
      L.stroke(t.accent);
      doc.setLineWidth(1);
      doc.rect(L.left, L.y, L.width, boxH);
      L.fill(t.tint);
      doc.rect(L.left, L.y, L.width, boxH, 'F');
      doc.rect(L.left, L.y, L.width, boxH);
      const boxLogoW = drawLogo(doc, d.logoDataUrl, L.left + 12, L.y + 15, 54, 46);
      const textX = boxLogoW ? L.left + 12 + boxLogoW + 14 : L.left + 14;
      L.font('bold', 13);
      L.ink(t.accent);
      doc.text(d.contractorName, textX, L.y + 30);
      L.font('normal', 8);
      L.ink(t.muted);
      doc.text(addr.join(', '), textX, L.y + 45);
      if (contact) doc.text(contact, textX, L.y + 57);
      L.y += boxH + 24;
      break;
    }
    case 'split-tab': {
      // Harbor — accent rule down the left edge, details stacked beside it.
      L.fill(t.accent);
      doc.rect(0, 0, 14, PAGE_H, 'F');
      const tabLogoW = drawLogo(doc, d.logoDataUrl, L.left, L.y, 50, 42);
      const textX = tabLogoW ? L.left + tabLogoW + 14 : L.left;
      L.font('bold', 15);
      L.ink(t.accent);
      doc.text(d.contractorName, textX, L.y + 16);
      L.font('normal', 8.2);
      L.ink(t.muted);
      doc.text(addr.join(', '), textX, L.y + 30);
      if (contact) doc.text(contact, textX, L.y + 41);
      L.y += 62;
      break;
    }
  }
}

// ── Title ────────────────────────────────────────────────────────────────────

function drawTitle(L: Layout) {
  const t = L.t;
  const doc = L.doc;
  const TITLE = 'HOME IMPROVEMENT SERVICE AGREEMENT';

  switch (t.title) {
    case 'centered-caps': {
      L.font('bold', 13.5);
      L.ink(t.ink);
      L.tracked(TITLE, PAGE_W / 2, L.y + 12, L.width, 13.5, 'center');
      L.y += 34;
      break;
    }
    case 'band-inline': {
      L.font('bold', 16);
      L.ink(t.accent);
      doc.text('Service Agreement', L.left, L.y + 14);
      L.y += 22;
      L.stroke(t.accent);
      doc.setLineWidth(2);
      doc.line(L.left, L.y, L.left + 46, L.y);
      L.y += 20;
      break;
    }
    case 'oversized-left': {
      L.font('normal', 26);
      L.ink(t.ink);
      doc.text('Service', L.left, L.y + 22);
      L.font('bold', 26);
      L.ink(t.accent);
      doc.text('Agreement', L.left, L.y + 52);
      L.y += 78;
      break;
    }
    case 'boxed-center': {
      L.fill(t.accent);
      doc.rect(L.left, L.y, L.width, 26, 'F');
      doc.setTextColor(255, 255, 255);
      L.font('bold', 11.5);
      doc.text(TITLE, PAGE_W / 2, L.y + 17.5, { align: 'center' });
      L.y += 42;
      break;
    }
    case 'underscored-left': {
      L.font('bold', 19);
      L.ink(t.ink);
      doc.text('Service Agreement', L.left, L.y + 16);
      L.y += 24;
      L.fill(tintOf(t.accent, 0.78));
      doc.rect(L.left, L.y - 4, 150, 5, 'F');
      L.y += 20;
      break;
    }
  }
}

// ── Parties block ────────────────────────────────────────────────────────────

function drawParties(L: Layout, d: ContractData) {
  const t = L.t;
  const formal = isFormal(t);

  if (formal) {
    L.para(`THIS AGREEMENT DATED this: ${d.agreementDate}`, { style: 'bold', gap: 2 });
    L.para('(YYYY/MM/DD)', { size: 7.5, color: t.muted, gap: 10 });
    L.para('BETWEEN:', { style: 'bold', gap: 4 });
    L.para(d.ownerName || '—', { style: 'bold', indent: 24, gap: 1 });
    L.para('(hereinafter called the "Owner") OF THE FIRST PART', { indent: 24, size: t.bodySize - 0.5, color: t.muted, gap: 8 });
    L.para('— and —', { indent: 24, gap: 8 });
    L.para(d.contractorName, { style: 'bold', indent: 24, gap: 1 });
    L.para('(hereinafter called the "Contractor") OF THE SECOND PART', { indent: 24, size: t.bodySize - 0.5, color: t.muted, gap: 14 });
    L.para(
      `WHEREAS the Owner wishes to retain the Contractor to provide home improvement services relating to the Owner's property at ${d.propertyAddress || '—'};`,
      { gap: 8 },
    );
    L.para('AND WHEREAS the Owner wishes to retain the Contractor upon the terms and conditions herein set out;', { gap: 8 });
    L.para(
      'NOW THEREFORE in consideration of the mutual covenants and agreements herein contained, the parties agree as follows:',
      { gap: 12 },
    );
    return;
  }

  // Plain-English templates use a labelled detail grid instead of recitals.
  const rows: Array<[string, string]> = [
    ['Agreement date', d.agreementDate],
    ['Homeowner', d.ownerName || '—'],
    ['Contact', [d.ownerPhone, d.ownerEmail].filter(Boolean).join('  ·  ') || '—'],
    ['Property', d.propertyAddress || '—'],
    ['Contractor', d.contractorName],
  ];
  const labelW = 96;
  rows.forEach(([label, value]) => {
    const lh = t.bodySize * t.leading;
    L.font('normal', t.bodySize);
    const lines = L.doc.splitTextToSize(value, L.width - labelW) as string[];
    L.ensure(lh * lines.length);
    L.font('bold', t.bodySize - 0.8);
    L.ink(t.muted);
    L.doc.text(label.toUpperCase(), L.left, L.y + t.bodySize * 0.85);
    L.font('normal', t.bodySize);
    L.ink(t.ink);
    lines.forEach((line, i) => {
      L.doc.text(line, L.left + labelW, L.y + t.bodySize * 0.85 + i * lh);
    });
    L.y += lh * lines.length + 2;
  });
  L.gap(10);
  L.rule();
  L.gap(6);
}

// ── Payment section ──────────────────────────────────────────────────────────

function drawPayment(L: Layout, d: ContractData) {
  const t = L.t;
  const formal = isFormal(t);
  const price = `${money(d.totalPrice)}${d.taxNote ? ` ${d.taxNote}` : ''}`;

  // The headline price, given its own emphasis in every template.
  L.ensure(30);
  if (t.id === 'harbor' || t.id === 'vertex') {
    const boxH = 30;
    L.fill(t.tint);
    L.doc.rect(L.left, L.y, L.width, boxH, 'F');
    L.font('bold', t.bodySize - 0.6);
    L.ink(t.muted);
    L.doc.text('TOTAL PRICE', L.left + 12, L.y + 12);
    L.font('bold', 14);
    L.ink(t.accent);
    L.doc.text(price, L.left + 12, L.y + 25);
    L.y += boxH + 12;
  } else {
    L.para(`Total Price: ${price}`, { style: 'bold', size: t.bodySize + 2, gap: 8 });
  }

  const financing = d.paymentMethod === 'financing' || d.paymentMethod === 'both';
  const cash = d.paymentMethod === 'cash' || d.paymentMethod === 'both';
  let sub = 0;
  const marker = () => (t.numbering === 'padded' ? `${L.section}.${sub}` : undefined);

  if (financing) {
    L.para(formal ? 'Financing.' : 'Financing', { style: 'bold', gap: 5 });
    const lines = [
      `${d.financeRate || '—'}% interest, ${d.financeTermMonths || '—'}-month term, ${d.financeAmortMonths || '—'}-month amortisation. Monthly payment: ${d.financeMonthlyPayment ? `$${d.financeMonthlyPayment}` : '—'} (including taxes).`,
      formal
        ? `Up to ${d.financeUpfrontPct || '40'}% of funds may be released upon execution of this Agreement or at project commencement, subject to the Owner's authorisation.`
        : `Up to ${d.financeUpfrontPct || '40'}% of the funds can be released when you sign or when we start, with your authorisation.`,
      formal
        ? `The balance of ${100 - Number(d.financeUpfrontPct || 40)}% is released upon completion of the works.`
        : `The remaining ${100 - Number(d.financeUpfrontPct || 40)}% is released once the project is complete.`,
      formal
        ? 'No upfront cost, no early payment penalty, and no lien is registered against the Property.'
        : 'No upfront cost, no early-payment penalties, and no liens registered against your property.',
      formal
        ? 'During the currency of the works a minimum payment calculated at 0.40% of the total funds requested to date is deducted monthly or biweekly according to the requested payment schedule. That payment is applied wholly against principal and includes no interest.'
        : 'While the project is running, a minimum payment of 0.40% of the funds released so far comes out monthly or biweekly, whichever schedule you pick. It goes entirely against the principal — no interest.',
      'A one-time administration fee applies.',
    ];
    lines.forEach((line) => { sub += 1; L.listItem(line, marker()); });
    L.gap(6);
  }

  if (cash) {
    L.para(formal ? 'Cash.' : 'Cash', { style: 'bold', gap: 5 });
    const schedule = d.cashSchedule.filter((s) => s.pct || s.when);
    if (schedule.length === 0) {
      L.listItem('Not applicable.');
    } else {
      schedule.forEach((s) => { sub += 1; L.listItem(`${s.pct || '—'}% ${s.when || ''}`.trim(), marker()); });
    }
    L.gap(6);
  }

  if (!financing && !cash) L.listItem('Payment terms to be confirmed in writing.');
}

// ── Scope table ──────────────────────────────────────────────────────────────

function drawScope(L: Layout, d: ContractData) {
  const t = L.t;
  const doc = L.doc;
  const lines = d.scope.filter((l) => l.item.trim() || l.detail.trim());
  if (lines.length === 0) return;

  L.gap(12);
  L.ensure(60);

  // Scope heading — deliberately set apart from the clause headings.
  L.font('bold', t.bodySize + 3);
  L.ink(t.accent);
  if (t.title === 'centered-caps') {
    doc.text(t.scopeHeading.toUpperCase(), PAGE_W / 2, L.y + 12, { align: 'center' });
  } else {
    doc.text(t.scopeHeading, L.left, L.y + 12);
  }
  L.y += 26;

  L.para(t.scopeNote, { size: t.bodySize - 0.8, color: t.muted, style: 'italic', gap: 10 });

  const numW = 24;
  const itemW = (L.width - numW) * 0.52;
  const detailW = L.width - numW - itemW;
  const padX = 6;
  const padY = 5;
  const size = t.bodySize - 0.5;
  const lh = size * 1.32;

  // Header row (only for the table styles that have one).
  const header = () => {
    if (t.scopeTable === 'open' || t.scopeTable === 'rules-only') return;
    const h = 20;
    L.ensure(h);
    if (t.scopeTable === 'zebra' || t.scopeTable === 'boxed-header') {
      L.fill(t.scopeTable === 'zebra' ? t.accent : tintOf(t.accent, 0.84));
      doc.rect(L.left, L.y, L.width, h, 'F');
    }
    if (t.scopeTable === 'bordered' || t.scopeTable === 'boxed-header') {
      L.stroke(t.rule);
      doc.setLineWidth(0.7);
      doc.rect(L.left, L.y, L.width, h);
    }
    L.font('bold', size - 0.5);
    if (t.scopeTable === 'zebra') doc.setTextColor(255, 255, 255);
    else L.ink(t.accent);
    doc.text('#', L.left + padX, L.y + 13);
    doc.text('DESCRIPTION', L.left + numW + padX, L.y + 13);
    doc.text('SPECIFICATION', L.left + numW + itemW + padX, L.y + 13);
    L.y += h;
  };
  header();

  lines.forEach((line, idx) => {
    L.font('normal', size);
    const itemLines = doc.splitTextToSize(line.item || '—', itemW - padX * 2) as string[];
    const detailLines = doc.splitTextToSize(line.detail || '', detailW - padX * 2) as string[];

    // The spec column can carry a product photo and a link beneath its text,
    // the way the signed agreements present appliances and finishes.
    const linkH = line.linkUrl ? lh : 0;
    let imgW = 0;
    let imgH = 0;
    if (line.imageDataUrl) {
      try {
        const props = doc.getImageProperties(line.imageDataUrl);
        const boxW = detailW - padX * 2;
        const boxH = 104;
        const scale = Math.min(boxW / props.width, boxH / props.height);
        imgW = props.width * scale;
        imgH = props.height * scale;
      } catch {
        imgW = 0;
        imgH = 0;
      }
    }

    const detailH = detailLines.length * lh + linkH + (imgH ? imgH + 6 : 0);
    const rowH = Math.max(itemLines.length * lh, detailH, lh) + padY * 2;

    if (L.y + rowH > L.bottom) {
      doc.addPage();
      L.y = t.margin.top;
      L.runningHeader();
      header();
    }

    // Row background / borders.
    if (t.scopeTable === 'zebra' && idx % 2 === 1) {
      L.fill(tintOf(t.accent, 0.955));
      doc.rect(L.left, L.y, L.width, rowH, 'F');
    }
    if (t.scopeTable === 'bordered' || t.scopeTable === 'boxed-header') {
      L.stroke(t.rule);
      doc.setLineWidth(0.5);
      doc.rect(L.left, L.y, L.width, rowH);
      doc.line(L.left + numW, L.y, L.left + numW, L.y + rowH);
      doc.line(L.left + numW + itemW, L.y, L.left + numW + itemW, L.y + rowH);
    }
    if (t.scopeTable === 'rules-only' && idx > 0) {
      L.stroke(t.rule);
      doc.setLineWidth(0.4);
      doc.line(L.left, L.y, L.right, L.y);
    }

    // Cells.
    L.font('bold', size - 0.5);
    L.ink(t.muted);
    doc.text(String(idx + 1), L.left + padX, L.y + padY + size);
    L.font('normal', size);
    L.ink(t.ink);
    itemLines.forEach((ln, i) => doc.text(ln, L.left + numW + padX, L.y + padY + size + i * lh));

    const detailX = L.left + numW + itemW + padX;
    L.ink(t.muted);
    detailLines.forEach((ln, i) => doc.text(ln, detailX, L.y + padY + size + i * lh));

    let dy = L.y + padY + detailLines.length * lh;
    if (line.linkUrl) {
      L.font('normal', size);
      L.ink(t.muted);
      doc.text('Product Link ', detailX, dy + size);
      const linkX = detailX + doc.getTextWidth('Product Link ');
      L.ink(t.accent);
      doc.textWithLink('here', linkX, dy + size, { url: line.linkUrl });
      // jsPDF doesn't underline, so draw the rule ourselves.
      L.stroke(t.accent);
      doc.setLineWidth(0.4);
      doc.line(linkX, dy + size + 1.5, linkX + doc.getTextWidth('here'), dy + size + 1.5);
      dy += lh;
    }
    if (imgH) {
      try {
        doc.addImage(line.imageDataUrl as string, imageFormat(line.imageDataUrl as string), detailX, dy + 4, imgW, imgH);
      } catch { /* undecodable photo — the row still reads correctly without it */ }
    }

    L.y += rowH;
  });

  L.gap(14);
}

// ── Signatures ───────────────────────────────────────────────────────────────

function drawSignatures(L: Layout, d: ContractData) {
  const t = L.t;
  const doc = L.doc;

  L.gap(16);
  L.ensure(150);
  L.para(t.execution.replace('the date first above written', `${d.agreementDate}`), { gap: 6 });
  if (isFormal(t)) L.para(`Dated: ${d.agreementDate}  (YYYY/MM/DD)`, { size: t.bodySize - 1, color: t.muted, gap: 18 });
  else L.gap(14);

  const sigLine = (x: number, w: number, name: string, role: string) => {
    L.stroke(t.ink);
    doc.setLineWidth(0.7);
    doc.line(x, L.y + 26, x + w, L.y + 26);
    L.font('bold', t.bodySize - 0.5);
    L.ink(t.ink);
    if (name) doc.text(name, x, L.y + 38);
    L.font('normal', t.bodySize - 1.5);
    L.ink(t.muted);
    doc.text(role, x, L.y + 49);
    L.font('normal', t.bodySize - 2);
    doc.text('Date: ______________________', x, L.y + 64);
  };

  switch (t.signatures) {
    case 'two-column': {
      const colW = (L.width - 32) / 2;
      sigLine(L.left, colW, d.ownerName, 'Owner');
      sigLine(L.left + colW + 32, colW, d.contractorSignatory, `for ${d.contractorName}`);
      L.y += 80;
      break;
    }
    case 'boxed-pair': {
      const colW = (L.width - 20) / 2;
      L.stroke(t.rule);
      doc.setLineWidth(0.7);
      doc.rect(L.left, L.y, colW, 88);
      doc.rect(L.left + colW + 20, L.y, colW, 88);
      L.y += 12;
      sigLine(L.left + 12, colW - 24, d.ownerName, 'Owner');
      sigLine(L.left + colW + 32, colW - 24, d.contractorSignatory, `for ${d.contractorName}`);
      L.y += 88;
      break;
    }
    case 'rule-pair': {
      // Atlas — narrow rules, generous space, labels underneath in small caps.
      sigLine(L.left, 200, d.ownerName, 'OWNER');
      L.y += 84;
      L.ensure(80);
      sigLine(L.left, 200, d.contractorSignatory, `FOR ${d.contractorName.toUpperCase()}`);
      L.y += 78;
      break;
    }
    case 'stacked-lines':
    default: {
      // Meridian — traditional stacked execution: the party is named above the
      // line it signs on, the way a solicitor-drafted instrument reads.
      const party = (caption: string, role: string) => {
        L.ensure(84);
        L.font('normal', t.bodySize);
        L.ink(t.ink);
        doc.text(caption, L.left, L.y + 10);
        L.y += 14;
        sigLine(L.left, 240, '', role);
        L.y += 78;
      };
      party(`Per Name: ${d.ownerName || '—'}`, 'Owner');
      party(`${d.contractorName}   Per Name: ${d.contractorSignatory || '—'}`, 'Contractor');
      party('Witnessed by:', 'Witness');
      break;
    }
  }
}

// ── Footers ──────────────────────────────────────────────────────────────────

function drawFooters(L: Layout, d: ContractData) {
  const t = L.t;
  const doc = L.doc;
  const total = doc.getNumberOfPages();
  const firstBody = t.cover === 'none' ? 1 : 2;
  for (let p = firstBody; p <= total; p += 1) {
    doc.setPage(p);
    const yF = PAGE_H - t.margin.bottom + 26;
    doc.setFont(contractFontsReady() ? t.font : t.fontFallback, 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(t.muted[0], t.muted[1], t.muted[2]);

    switch (t.footer) {
      case 'centered-page':
        doc.text(`Page ${p} of ${total}`, PAGE_W / 2, yF, { align: 'center' });
        break;
      case 'rule-left':
        doc.setDrawColor(t.rule[0], t.rule[1], t.rule[2]);
        doc.setLineWidth(0.5);
        doc.line(t.margin.left, yF - 12, PAGE_W - t.margin.right, yF - 12);
        doc.text(`${d.contractorName} — Service Agreement`, t.margin.left, yF);
        doc.text(`${p} / ${total}`, PAGE_W - t.margin.right, yF, { align: 'right' });
        break;
      case 'minimal-right':
        doc.text(String(p), PAGE_W - t.margin.right, yF, { align: 'right' });
        break;
      case 'boxed':
        doc.setDrawColor(t.rule[0], t.rule[1], t.rule[2]);
        doc.setLineWidth(0.6);
        doc.line(t.margin.left, yF - 14, PAGE_W - t.margin.right, yF - 14);
        doc.text(d.ownerName ? `${d.ownerName} — ${d.propertyAddress}` : d.contractorName, t.margin.left, yF);
        doc.text(`Page ${p} of ${total}`, PAGE_W - t.margin.right, yF, { align: 'right' });
        break;
    }
  }
}

// ── Entry point ──────────────────────────────────────────────────────────────

const SECTION_RENDERERS: Partial<Record<SectionKey, (L: Layout, d: ContractData) => void>> = {
  payment: drawPayment,
};

export function buildContractPdf(data: ContractData): jsPDF {
  const base = getTemplate(data.templateId);
  // The accent (and therefore every wash derived from it) can be replaced by the
  // contractor's brand colour without the template knowing anything about it.
  const accent = data.accentOverride ?? base.accent;
  const t: TemplateSpec = { ...base, accent, tint: tintOf(accent) };
  const L = new Layout(t);

  const covered = drawCover(L, data);
  // A cover already carries the branding and the title, so the body page opens
  // with a lighter running head instead of repeating the full masthead.
  if (covered) L.runningHeader();
  else drawMasthead(L, data);
  if (!covered) drawTitle(L);
  drawParties(L, data);

  // Clause body may run in columns; the scope table and signatures never do.
  L.setColumns(t.columns);

  t.order.forEach((key) => {
    const clause = t.clauses[key];
    L.heading(clause.heading);

    if (key === 'commencement') {
      // Dates are data, not boilerplate — they lead the section.
      L.para(
        isFormal(t)
          ? `Start Date: ${data.startDate || '—'}    Completion Date: ${data.completionDate || '—'}  (YYYY/MM/DD)`
          : `Start: ${data.startDate || '—'}   ·   Substantial completion: ${data.completionDate || '—'}`,
        { style: 'bold', gap: 8 },
      );
    }

    clause.paras?.forEach((p) => L.para(p));
    let n = 0;
    clause.bullets?.forEach((b) => {
      n += 1;
      L.listItem(b, t.numbering === 'padded' ? `${L.section}.${n}` : undefined);
    });

    SECTION_RENDERERS[key]?.(L, data);
  });

  if (data.specialTerms.trim()) {
    L.heading('Additional Terms');
    data.specialTerms
      .split(/\n{2,}/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((p) => L.para(p));
  }

  L.endColumns();

  drawScope(L, data);

  if (t.signaturePage) {
    L.doc.addPage();
    L.y = t.margin.top;
    L.runningHeader();
  }
  drawSignatures(L, data);
  drawFooters(L, data);

  return L.doc;
}

/** Filename we save the agreement under (also the blob path leaf). */
export function contractFileName(d: ContractData): string {
  const safe = (s: string) => s.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'agreement';
  const date = d.agreementDate.replace(/\//g, '-');
  return `${safe(d.contractorName)}-service-agreement-${safe(d.ownerName)}-${date}.pdf`;
}
