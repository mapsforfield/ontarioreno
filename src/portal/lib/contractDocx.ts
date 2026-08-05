// ─── Sales Agreement .docx renderer ──────────────────────────────────────────
//
// The PDF renderer (contractPdf.ts) is a drawing engine: it positions glyphs and
// rectangles at absolute coordinates. That is exactly what you must NOT do for
// Word — a document built out of positioned boxes opens as an unmaintainable
// mess of text frames, and reps ask for the Word file precisely because they
// want to edit it.
//
// So this is a second renderer over the same ContractData and the same
// TemplateSpec, emitting native Word constructs:
//
//   · real Heading 1/2 styles, so the navigation pane and TOC work
//   · a real numbering definition per template, so bullets renumber on edit
//   · a real table for the scope of work, with a repeating header row
//   · real page headers/footers with PAGE/NUMPAGES fields
//   · real section columns for the two-column template
//   · paragraph borders and cell shading instead of drawn rectangles
//
// The `docx` package is loaded on demand so it stays out of the portal's main
// chunk — only a rep who actually clicks "Download Word" pays for it.
//
// Fidelity note: a few PDF flourishes are page-painting tricks with no Word
// equivalent (full-bleed accent bands, Atlas's left margin rail). Those are
// translated to the nearest native construct — a shaded full-width table row, a
// compact top-left masthead — rather than faked with floating shapes.

import type { RGB, TemplateSpec } from '../data/contractTemplates';
import { getTemplate } from '../data/contractTemplates';
import { tintOf } from './brandColor';
import { money, numberOr, stripUnits, type ContractData } from './contractPdf';
import { embedBoldAndFallback, FONT_IDENTITY, loadFontPair } from './contractDocxFonts';

/** Word wants colours as bare hex, no leading hash. */
function hex(c: RGB): string {
  return c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV'];
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Points → half-points (Word's run size unit). */
const hp = (pt: number) => Math.round(pt * 2);
/** Points → twips (Word's measurement unit). */
const tw = (pt: number) => Math.round(pt * 20);

function isFormal(t: TemplateSpec): boolean {
  return t.id === 'meridian' || t.id === 'sterling' || t.id === 'atlas';
}

function sectionLabel(t: TemplateSpec, n: number): string {
  if (t.numbering === 'roman') return `${ROMAN[n - 1] ?? n}. `;
  if (t.numbering === 'decimal') return `${n}. `;
  if (t.numbering === 'padded') return `${String(n).padStart(2, '0')}  `;
  if (t.numbering === 'lettered') return `${LETTERS[(n - 1) % 26]}. `;
  return '';
}

/** Letterspacing, the way the PDF's tracked headings read. */
function tracked(text: string): string {
  return text.split('').join(' ');
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const bin = atob(base64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

/** Natural pixel size of a data URL, so images keep their aspect ratio. */
function imageSize(dataUrl: string): Promise<{ w: number; h: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth || 1, h: img.naturalHeight || 1 });
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

/** Letterbox an image into a box, in points, preserving aspect. */
function fit(nat: { w: number; h: number }, boxW: number, boxH: number) {
  const scale = Math.min(boxW / nat.w, boxH / nat.h);
  return { width: Math.round(nat.w * scale), height: Math.round(nat.h * scale) };
}

type ImageAsset = { data: Uint8Array; type: 'png' | 'jpg'; nat: { w: number; h: number } };

async function loadAsset(dataUrl: string | null | undefined): Promise<ImageAsset | null> {
  if (!dataUrl) return null;
  const nat = await imageSize(dataUrl);
  if (!nat) return null;
  try {
    return { data: dataUrlToBytes(dataUrl), type: dataUrl.startsWith('data:image/jpeg') ? 'jpg' : 'png', nat };
  } catch {
    return null;
  }
}

/**
 * Build the agreement as a Word document.
 *
 * Returns a Blob ready to save or upload. Async because the `docx` module and
 * the image dimensions are both resolved on demand.
 */
export async function buildContractDocx(data: ContractData): Promise<Blob> {
  const D = await import('docx');
  const {
    AlignmentType, BorderStyle, Document, ExternalHyperlink, Footer, Header, HeadingLevel, ImageRun,
    LevelFormat, PageNumber, Packer, Paragraph, ShadingType, Table, TableCell, TableRow, TextRun, WidthType,
  } = D;

  const base = getTemplate(data.templateId);
  const accent = data.accentOverride ?? base.accent;
  const t: TemplateSpec = { ...base, accent, tint: tintOf(accent) };

  // The real face is embedded in the package, so the document travels with its
  // typography. If the font chunk won't load we name the substitute directly and
  // the agreement still renders — just in the stand-in face.
  const fonts = await loadFontPair(t.font);
  const identity = FONT_IDENTITY[t.font];
  const face = fonts ? identity.family : identity.fallback;
  const formal = isFormal(t);
  const INK = hex(t.ink);
  const MUTED = hex(t.muted);
  const ACCENT = hex(t.accent);
  const RULE = hex(t.rule);
  const TINT = hex(t.tint);
  const CONTENT_W = 612 - t.margin.left - t.margin.right; // points of live measure

  const logo = await loadAsset(data.logoDataUrl);
  const scopeLines = data.scope.filter((l) => l.item.trim() || l.detail.trim());
  const scopeAssets = await Promise.all(scopeLines.map((l) => loadAsset(l.imageDataUrl)));

  // ── Run/paragraph helpers ──────────────────────────────────────────────────

  type RunOpts = { bold?: boolean; italics?: boolean; size?: number; color?: string; caps?: boolean };
  const run = (text: string, o: RunOpts = {}) =>
    new TextRun({
      text: o.caps ? text.toUpperCase() : text,
      font: face,
      bold: o.bold,
      italics: o.italics,
      size: hp(o.size ?? t.bodySize),
      color: o.color ?? INK,
    });

  type ParaOpts = RunOpts & {
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    indent?: number;
    before?: number;
    after?: number;
    border?: 'bottom' | 'left-accent';
    shading?: string;
  };
  const para = (text: string, o: ParaOpts = {}) =>
    new Paragraph({
      alignment: o.align,
      spacing: {
        before: tw(o.before ?? 0),
        after: tw(o.after ?? t.bodySize * 0.42),
        line: Math.round(240 * t.leading),
      },
      indent: o.indent ? { left: tw(o.indent) } : undefined,
      shading: o.shading ? { type: ShadingType.CLEAR, fill: o.shading, color: 'auto' } : undefined,
      border:
        o.border === 'bottom'
          ? { bottom: { style: BorderStyle.SINGLE, size: 6, color: RULE, space: 4 } }
          : o.border === 'left-accent'
            ? { left: { style: BorderStyle.SINGLE, size: 18, color: ACCENT, space: 8 } }
            : undefined,
      children: [run(text, o)],
    });

  const spacer = (pt = 8) => new Paragraph({ spacing: { after: tw(pt) }, children: [] });

  /** A ruled line drawn as a paragraph border — editable, not a floating shape. */
  const rule = (color = RULE, size = 6) =>
    new Paragraph({
      spacing: { before: tw(2), after: tw(8) },
      border: { bottom: { style: BorderStyle.SINGLE, size, color, space: 1 } },
      children: [],
    });

  const noBorders = {
    top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  };
  const boxBorders = (color: string, size = 6) => ({
    top: { style: BorderStyle.SINGLE, size, color },
    bottom: { style: BorderStyle.SINGLE, size, color },
    left: { style: BorderStyle.SINGLE, size, color },
    right: { style: BorderStyle.SINGLE, size, color },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color },
    insideVertical: { style: BorderStyle.SINGLE, size: 4, color },
  });

  const logoRun = (boxW: number, boxH: number) =>
    logo
      ? new ImageRun({
          data: logo.data,
          type: logo.type,
          transformation: fit(logo.nat, boxW, boxH),
        })
      : null;

  // ── Headings ───────────────────────────────────────────────────────────────
  // Real Heading 1s. The navigation pane, TOC and outline view all work, and the
  // template's personality comes from the character formatting, not from a
  // hand-drawn box.

  let sectionNo = 0;
  const heading = (text: string): InstanceType<typeof Paragraph>[] => {
    sectionNo += 1;
    const label = sectionLabel(t, sectionNo);
    const size = t.bodySize + (t.headingStyle === 'tracked-mini' ? -1.6 : 1.6);

    const common = {
      heading: HeadingLevel.HEADING_1,
      spacing: { before: tw(t.bodySize * 1.1), after: tw(t.bodySize * 0.5) },
      keepNext: true,
    };

    switch (t.headingStyle) {
      case 'serif-caps-centered':
        return [new Paragraph({
          ...common,
          alignment: AlignmentType.CENTER,
          children: [run(tracked(`${label}${text.toUpperCase()}`), { bold: true, size, color: ACCENT })],
        })];
      case 'accent-bar':
        return [new Paragraph({
          ...common,
          border: { left: { style: BorderStyle.SINGLE, size: 18, color: ACCENT, space: 8 } },
          children: [run(`${label}${text}`, { bold: true, size, color: ACCENT })],
        })];
      case 'tracked-mini':
        return [new Paragraph({
          ...common,
          children: [run(tracked(text.toUpperCase()), { bold: true, size, color: ACCENT })],
        })];
      case 'rule-under':
        return [new Paragraph({
          ...common,
          border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: RULE, space: 3 } },
          children: [run(`${label}${text.toUpperCase()}`, { bold: true, size, color: ACCENT })],
        })];
      case 'side-tab':
      default:
        return [new Paragraph({
          ...common,
          shading: { type: ShadingType.CLEAR, fill: TINT, color: 'auto' },
          children: [run(`${label}${text}`, { bold: true, size, color: ACCENT })],
        })];
    }
  };

  // ── Lists ──────────────────────────────────────────────────────────────────
  // A real numbering definition, so a rep who adds a clause in Word gets the
  // template's glyph automatically instead of typing a character.

  const BULLET_CHAR: Record<TemplateSpec['bullet'], string> = {
    dash: '–', dot: '•', square: '▪', arrow: '➤', none: '',
  };

  const listItem = (text: string, marker?: string) => {
    if (marker) {
      // Sterling's 1.1 / 1.2 sub-clauses — the number is part of the clause's
      // identity (it gets cited), so it is literal text, not auto-numbering.
      return new Paragraph({
        spacing: { after: tw(t.bodySize * 0.35), line: Math.round(240 * t.leading) },
        indent: { left: tw(26), hanging: tw(26) },
        children: [run(`${marker}\t`, { bold: true, size: t.bodySize - 0.5, color: ACCENT }), run(text)],
      });
    }
    if (t.bullet === 'none') return para(text, { indent: 14 });
    return new Paragraph({
      numbering: { reference: 'contract-bullets', level: 0 },
      spacing: { after: tw(t.bodySize * 0.35), line: Math.round(240 * t.leading) },
      children: [run(text)],
    });
  };

  // ── Cover ──────────────────────────────────────────────────────────────────

  const coverChildren: InstanceType<typeof Paragraph | typeof Table>[] = [];
  if (t.cover === 'brand-block') {
    // Vertex — the PDF paints a full-bleed accent field. In Word that becomes a
    // full-width shaded table, which survives editing and reflows properly.
    const mark = logoRun(150, 56);
    coverChildren.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: noBorders,
      rows: [new TableRow({
        children: [new TableCell({
          shading: { type: ShadingType.CLEAR, fill: ACCENT, color: 'auto' },
          margins: { top: tw(28), bottom: tw(28), left: tw(24), right: tw(24) },
          children: [
            ...(mark ? [new Paragraph({ children: [mark], spacing: { after: tw(14) } })] : []),
            new Paragraph({ children: [run(data.contractorName, { bold: true, size: 26, color: 'FFFFFF' })] }),
            new Paragraph({ children: [run('HOME IMPROVEMENT SERVICE AGREEMENT', { size: 11, color: 'FFFFFF' })] }),
          ],
        })],
      })],
    }));
    coverChildren.push(spacer(28));
    const field = (label: string, value: string) => {
      if (!value) return;
      coverChildren.push(para(label, { caps: true, bold: true, size: 8, color: MUTED, after: 2 }));
      coverChildren.push(para(value, { size: 13, after: 12 }));
    };
    field('Prepared for', data.ownerName);
    field('Property', data.propertyAddress);
    field('Agreement date', data.agreementDate);
    coverChildren.push(rule(RULE, 8));
    coverChildren.push(para('TOTAL PRICE', { bold: true, size: 8, color: MUTED, after: 2 }));
    coverChildren.push(para(`${money(data.totalPrice)}${data.taxNote ? ` ${data.taxNote}` : ''}`,
      { bold: true, size: 24, color: ACCENT }));
  } else if (t.cover === 'document-control') {
    // Sterling — centred title over a document-control table.
    const mark = logoRun(130, 54);
    coverChildren.push(spacer(60));
    if (mark) coverChildren.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [mark], spacing: { after: tw(20) } }));
    coverChildren.push(para(data.contractorName, { align: AlignmentType.CENTER, bold: true, size: 17, color: ACCENT, after: 10 }));
    coverChildren.push(rule(RULE));
    coverChildren.push(spacer(20));
    coverChildren.push(para('HOME IMPROVEMENT', { align: AlignmentType.CENTER, bold: true, size: 15, after: 2 }));
    coverChildren.push(para('SERVICE AGREEMENT', { align: AlignmentType.CENTER, bold: true, size: 15, after: 34 }));
    coverChildren.push(para('DOCUMENT CONTROL', { bold: true, size: 8, color: MUTED, after: 4 }));
    const ctrl: Array<[string, string]> = [
      ['Owner', data.ownerName || '—'],
      ['Property', data.propertyAddress || '—'],
      ['Agreement date', data.agreementDate],
      ['Commencement', data.startDate || '—'],
      ['Completion', data.completionDate || '—'],
      ['Contract price', `${money(data.totalPrice)}${data.taxNote ? ` ${data.taxNote}` : ''}`],
    ];
    coverChildren.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        ...noBorders,
        top: { style: BorderStyle.SINGLE, size: 8, color: RULE },
        bottom: { style: BorderStyle.SINGLE, size: 8, color: RULE },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: 'E6EAF0' },
      },
      rows: ctrl.map(([k, v]) => new TableRow({
        children: [
          new TableCell({
            width: { size: 34, type: WidthType.PERCENTAGE },
            margins: { top: tw(5), bottom: tw(5) },
            children: [para(k, { caps: true, size: 8.5, color: MUTED, after: 0 })],
          }),
          new TableCell({
            width: { size: 66, type: WidthType.PERCENTAGE },
            margins: { top: tw(5), bottom: tw(5) },
            children: [para(v, { bold: true, size: 9.5, after: 0 })],
          }),
        ],
      })),
    }));
  }

  // ── Masthead ───────────────────────────────────────────────────────────────

  const addr = [data.contractorAddress1, data.contractorAddress2].filter(Boolean);
  const contact = [data.contractorPhone && `Tel ${data.contractorPhone}`, data.contractorEmail, data.contractorWebsite]
    .filter(Boolean)
    .join('   ·   ');

  const masthead: InstanceType<typeof Paragraph | typeof Table>[] = [];
  if (t.header === 'band') {
    // Vertex — shaded full-width row standing in for the bled accent band.
    const mark = logoRun(56, 48);
    masthead.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: noBorders,
      rows: [new TableRow({
        children: [
          ...(mark ? [new TableCell({
            width: { size: 16, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: ACCENT, color: 'auto' },
            margins: { top: tw(14), bottom: tw(14), left: tw(12) },
            children: [new Paragraph({ children: [mark] })],
          })] : []),
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: ACCENT, color: 'auto' },
            margins: { top: tw(14), bottom: tw(14), left: tw(12), right: tw(12) },
            children: [
              para(data.contractorName, { bold: true, size: 17, color: 'FFFFFF', after: 2 }),
              para(addr.join(', '), { size: 8.4, color: 'FFFFFF', after: 1 }),
              ...(contact ? [para(contact, { size: 8.4, color: 'FFFFFF', after: 0 })] : []),
            ],
          }),
        ],
      })],
    }));
    masthead.push(spacer(16));
  } else if (t.header === 'boxed') {
    const mark = logoRun(54, 46);
    masthead.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: boxBorders(ACCENT, 8),
      rows: [new TableRow({
        children: [
          ...(mark ? [new TableCell({
            width: { size: 16, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: TINT, color: 'auto' },
            margins: { top: tw(12), bottom: tw(12), left: tw(10) },
            children: [new Paragraph({ children: [mark] })],
          })] : []),
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: TINT, color: 'auto' },
            margins: { top: tw(12), bottom: tw(12), left: tw(12), right: tw(12) },
            children: [
              para(data.contractorName, { bold: true, size: 13, color: ACCENT, after: 3 }),
              para(addr.join(', '), { size: 8, color: MUTED, after: 1 }),
              ...(contact ? [para(contact, { size: 8, color: MUTED, after: 0 })] : []),
            ],
          }),
        ],
      })],
    }));
    masthead.push(spacer(18));
  } else if (t.header === 'stacked-serif') {
    const mark = logoRun(112, 44);
    if (mark) masthead.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [mark], spacing: { after: tw(10) } }));
    masthead.push(para(data.contractorName, { align: AlignmentType.CENTER, bold: true, size: 15, color: ACCENT, after: 4 }));
    addr.forEach((line) => masthead.push(para(line, { align: AlignmentType.CENTER, size: 8.6, color: MUTED, after: 1 })));
    if (contact) masthead.push(para(contact, { align: AlignmentType.CENTER, size: 8.6, color: MUTED, after: 6 }));
    masthead.push(rule(RULE, 8));
  } else if (t.header === 'split-tab') {
    // Harbor — the PDF runs an accent bar down the page edge; Word gets the same
    // gesture as a heavy left border on the letterhead block.
    const mark = logoRun(50, 42);
    if (mark) masthead.push(new Paragraph({ children: [mark], spacing: { after: tw(6) } }));
    masthead.push(new Paragraph({
      border: { left: { style: BorderStyle.SINGLE, size: 24, color: ACCENT, space: 10 } },
      spacing: { after: tw(2) },
      children: [run(data.contractorName, { bold: true, size: 15, color: ACCENT })],
    }));
    masthead.push(new Paragraph({
      border: { left: { style: BorderStyle.SINGLE, size: 24, color: ACCENT, space: 10 } },
      spacing: { after: tw(2) },
      children: [run(addr.join(', '), { size: 8.2, color: MUTED })],
    }));
    if (contact) {
      masthead.push(new Paragraph({
        border: { left: { style: BorderStyle.SINGLE, size: 24, color: ACCENT, space: 10 } },
        spacing: { after: tw(14) },
        children: [run(contact, { size: 8.2, color: MUTED })],
      }));
    }
  } else {
    // Atlas — the PDF sets the company in a rail out in the left margin. Word
    // has no margin flow, so it becomes a compact, quiet top-left block, which
    // keeps the template's minimal-editorial voice.
    const mark = logoRun(96, 40);
    if (mark) masthead.push(new Paragraph({ children: [mark], spacing: { after: tw(8) } }));
    masthead.push(para(data.contractorName, { bold: true, size: 9, after: 2 }));
    [...addr, data.contractorPhone, data.contractorEmail, data.contractorWebsite]
      .filter(Boolean)
      .forEach((line) => masthead.push(para(line as string, { size: 6.8, color: MUTED, after: 0.5 })));
    masthead.push(spacer(16));
  }

  // ── Title ──────────────────────────────────────────────────────────────────

  const TITLE = 'HOME IMPROVEMENT SERVICE AGREEMENT';
  const title: InstanceType<typeof Paragraph | typeof Table>[] = [];
  switch (t.title) {
    case 'centered-caps':
      title.push(para(tracked(TITLE), { align: AlignmentType.CENTER, bold: true, size: 13.5, after: 16 }));
      break;
    case 'band-inline':
      title.push(para('Service Agreement', { bold: true, size: 16, color: ACCENT, after: 2 }));
      title.push(new Paragraph({
        spacing: { after: tw(14) },
        border: { bottom: { style: BorderStyle.SINGLE, size: 16, color: ACCENT, space: 1 } },
        indent: { right: tw(CONTENT_W - 46) },
        children: [],
      }));
      break;
    case 'oversized-left':
      title.push(new Paragraph({
        spacing: { after: tw(18) },
        children: [run('Service ', { size: 26 }), run('Agreement', { bold: true, size: 26, color: ACCENT })],
      }));
      break;
    case 'boxed-center':
      title.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: noBorders,
        rows: [new TableRow({
          children: [new TableCell({
            shading: { type: ShadingType.CLEAR, fill: ACCENT, color: 'auto' },
            margins: { top: tw(6), bottom: tw(6) },
            children: [para(TITLE, { align: AlignmentType.CENTER, bold: true, size: 11.5, color: 'FFFFFF', after: 0 })],
          })],
        })],
      }));
      title.push(spacer(16));
      break;
    case 'underscored-left':
      title.push(para('Service Agreement', { bold: true, size: 19, after: 2 }));
      title.push(new Paragraph({
        spacing: { after: tw(14) },
        border: { bottom: { style: BorderStyle.SINGLE, size: 20, color: hex(tintOf(t.accent, 0.78)), space: 1 } },
        indent: { right: tw(CONTENT_W - 150) },
        children: [],
      }));
      break;
  }

  // ── Parties ────────────────────────────────────────────────────────────────

  const parties: InstanceType<typeof Paragraph | typeof Table>[] = [];
  if (formal) {
    parties.push(para(`THIS AGREEMENT DATED this: ${data.agreementDate}`, { bold: true, after: 1 }));
    parties.push(para('(YYYY/MM/DD)', { size: 7.5, color: MUTED, after: 8 }));
    parties.push(para('BETWEEN:', { bold: true, after: 4 }));
    parties.push(para(data.ownerName || '—', { bold: true, indent: 24, after: 0 }));
    parties.push(para('(hereinafter called the "Owner") OF THE FIRST PART', { indent: 24, size: t.bodySize - 0.5, color: MUTED, after: 8 }));
    parties.push(para('— and —', { indent: 24, after: 8 }));
    parties.push(para(data.contractorName, { bold: true, indent: 24, after: 0 }));
    parties.push(para('(hereinafter called the "Contractor") OF THE SECOND PART', { indent: 24, size: t.bodySize - 0.5, color: MUTED, after: 14 }));
    parties.push(para(`WHEREAS the Owner wishes to retain the Contractor to provide home improvement services relating to the Owner's property at ${data.propertyAddress || '—'};`, { after: 8 }));
    parties.push(para('AND WHEREAS the Owner wishes to retain the Contractor upon the terms and conditions herein set out;', { after: 8 }));
    parties.push(para('NOW THEREFORE in consideration of the mutual covenants and agreements herein contained, the parties agree as follows:', { after: 12 }));
  } else {
    const rows: Array<[string, string]> = [
      ['Agreement date', data.agreementDate],
      ['Homeowner', data.ownerName || '—'],
      ['Contact', [data.ownerPhone, data.ownerEmail].filter(Boolean).join('  ·  ') || '—'],
      ['Property', data.propertyAddress || '—'],
      ['Contractor', data.contractorName],
    ];
    parties.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: noBorders,
      rows: rows.map(([label, value]) => new TableRow({
        children: [
          new TableCell({
            width: { size: 24, type: WidthType.PERCENTAGE },
            margins: { top: tw(2), bottom: tw(2) },
            children: [para(label, { caps: true, bold: true, size: t.bodySize - 0.8, color: MUTED, after: 0 })],
          }),
          new TableCell({
            width: { size: 76, type: WidthType.PERCENTAGE },
            margins: { top: tw(2), bottom: tw(2) },
            children: [para(value, { after: 0 })],
          }),
        ],
      })),
    }));
    parties.push(spacer(8));
    parties.push(rule());
  }

  // ── Payment ────────────────────────────────────────────────────────────────

  const paymentBody = (): InstanceType<typeof Paragraph | typeof Table>[] => {
    const out: InstanceType<typeof Paragraph | typeof Table>[] = [];
    const price = `${money(data.totalPrice)}${data.taxNote ? ` ${data.taxNote}` : ''}`;

    if (t.id === 'harbor' || t.id === 'vertex') {
      out.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: noBorders,
        rows: [new TableRow({
          children: [new TableCell({
            shading: { type: ShadingType.CLEAR, fill: TINT, color: 'auto' },
            margins: { top: tw(6), bottom: tw(6), left: tw(12) },
            children: [
              para('TOTAL PRICE', { bold: true, size: t.bodySize - 0.6, color: MUTED, after: 1 }),
              para(price, { bold: true, size: 14, color: ACCENT, after: 0 }),
            ],
          })],
        })],
      }));
      out.push(spacer(10));
    } else {
      out.push(para(`Total Price: ${price}`, { bold: true, size: t.bodySize + 2, after: 8 }));
    }

    const financing = data.paymentMethod === 'financing' || data.paymentMethod === 'both';
    const cash = data.paymentMethod === 'cash' || data.paymentMethod === 'both';
    let sub = 0;
    const marker = () => (t.numbering === 'padded' ? `${sectionNo}.${sub}` : undefined);

    if (financing) {
      out.push(para(formal ? 'Financing.' : 'Financing', { bold: true, after: 5 }));
      const rate = stripUnits(data.financeRate) || '—';
      const term = stripUnits(data.financeTermMonths) || '—';
      const amort = stripUnits(data.financeAmortMonths) || '—';
      const monthly = stripUnits(data.financeMonthlyPayment);
      const upfront = numberOr(data.financeUpfrontPct, 40);
      [
        `${rate}% interest, ${term}-month term, ${amort}-month amortisation. Monthly payment: ${monthly ? `$${monthly}` : '—'} (including taxes).`,
        formal
          ? `Up to ${upfront}% of funds may be released upon execution of this Agreement or at project commencement, subject to the Owner's authorisation.`
          : `Up to ${upfront}% of the funds can be released when you sign or when we start, with your authorisation.`,
        formal
          ? `The balance of ${100 - upfront}% is released upon completion of the works.`
          : `The remaining ${100 - upfront}% is released once the project is complete.`,
        formal
          ? 'No upfront cost, no early payment penalty, and no lien is registered against the Property.'
          : 'No upfront cost, no early-payment penalties, and no liens registered against your property.',
        formal
          ? 'During the currency of the works a minimum payment calculated at 0.40% of the total funds requested to date is deducted monthly or biweekly according to the requested payment schedule. That payment is applied wholly against principal and includes no interest.'
          : 'While the project is running, a minimum payment of 0.40% of the funds released so far comes out monthly or biweekly, whichever schedule you pick. It goes entirely against the principal — no interest.',
        'A one-time administration fee applies.',
      ].forEach((line) => { sub += 1; out.push(listItem(line, marker())); });
      out.push(spacer(6));
    }

    if (cash) {
      out.push(para(formal ? 'Cash.' : 'Cash', { bold: true, after: 5 }));
      const schedule = data.cashSchedule.filter((s) => s.pct || s.when);
      if (schedule.length === 0) {
        out.push(listItem('Not applicable.'));
      } else {
        schedule.forEach((s) => {
          sub += 1;
          out.push(listItem(`${stripUnits(s.pct) || '—'}% ${s.when || ''}`.trim(), marker()));
        });
      }
      out.push(spacer(6));
    }

    if (!financing && !cash) out.push(listItem('Payment terms to be confirmed in writing.'));
    return out;
  };

  // ── Clause body ────────────────────────────────────────────────────────────

  const body: InstanceType<typeof Paragraph | typeof Table>[] = [];
  t.order.forEach((key) => {
    const clause = t.clauses[key];
    body.push(...heading(clause.heading));

    if (key === 'commencement') {
      body.push(para(
        formal
          ? `Start Date: ${data.startDate || '—'}    Completion Date: ${data.completionDate || '—'}  (YYYY/MM/DD)`
          : `Start: ${data.startDate || '—'}   ·   Substantial completion: ${data.completionDate || '—'}`,
        { bold: true, after: 8 },
      ));
    }

    clause.paras?.forEach((p) => body.push(para(p)));
    let n = 0;
    clause.bullets?.forEach((b) => {
      n += 1;
      body.push(listItem(b, t.numbering === 'padded' ? `${sectionNo}.${n}` : undefined));
    });

    if (key === 'payment') body.push(...paymentBody());
  });

  if (data.specialTerms.trim()) {
    body.push(...heading('Additional Terms'));
    data.specialTerms
      .split(/\n{2,}/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((p) => body.push(para(p)));
  }

  // ── Scope table ────────────────────────────────────────────────────────────
  // A real Word table: sortable, editable, with a header row that repeats across
  // pages. This is the part reps most often need to change after the fact.

  const scope: InstanceType<typeof Paragraph | typeof Table>[] = [];
  if (scopeLines.length > 0) {
    scope.push(spacer(10));
    scope.push(new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: t.title === 'centered-caps' ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: { before: tw(10), after: tw(6) },
      keepNext: true,
      children: [run(t.scopeHeading, { bold: true, size: t.bodySize + 3, color: ACCENT })],
    }));
    scope.push(para(t.scopeNote, { italics: true, size: t.bodySize - 0.8, color: MUTED, after: 10 }));

    const size = t.bodySize - 0.5;
    const hasHeader = t.scopeTable !== 'open' && t.scopeTable !== 'rules-only';
    const zebra = t.scopeTable === 'zebra';

    const borders =
      t.scopeTable === 'bordered' || t.scopeTable === 'boxed-header'
        ? boxBorders(RULE, 4)
        : t.scopeTable === 'rules-only'
          ? { ...noBorders, insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: RULE } }
          : noBorders;

    const rows: InstanceType<typeof TableRow>[] = [];
    if (hasHeader) {
      const fill = zebra ? ACCENT : hex(tintOf(t.accent, 0.84));
      const color = zebra ? 'FFFFFF' : ACCENT;
      rows.push(new TableRow({
        tableHeader: true, // repeats on every page — Word does this natively
        children: ['#', 'DESCRIPTION', 'SPECIFICATION'].map((label, i) => new TableCell({
          width: { size: i === 0 ? 7 : i === 1 ? 48 : 45, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, fill, color: 'auto' },
          margins: { top: tw(4), bottom: tw(4), left: tw(6), right: tw(6) },
          children: [para(label, { bold: true, size: size - 0.5, color, after: 0 })],
        })),
      }));
    }

    scopeLines.forEach((line, idx) => {
      const asset = scopeAssets[idx];
      const detail: InstanceType<typeof Paragraph>[] = [];
      if (line.detail) detail.push(para(line.detail, { size, color: MUTED, after: 2 }));
      if (line.linkUrl) {
        detail.push(new Paragraph({
          spacing: { after: tw(2) },
          children: [
            run('Product Link ', { size, color: MUTED }),
            new ExternalHyperlink({
              link: line.linkUrl,
              children: [new TextRun({ text: 'here', font: face, size: hp(size), color: ACCENT, underline: {} })],
            }),
          ],
        }));
      }
      if (asset) {
        detail.push(new Paragraph({
          spacing: { after: tw(2) },
          children: [new ImageRun({ data: asset.data, type: asset.type, transformation: fit(asset.nat, 150, 104) })],
        }));
      }
      if (detail.length === 0) detail.push(para('', { after: 0 }));

      const shading = zebra && idx % 2 === 1
        ? { type: ShadingType.CLEAR, fill: hex(tintOf(t.accent, 0.955)), color: 'auto' }
        : undefined;
      const cell = (children: InstanceType<typeof Paragraph>[], width: number) => new TableCell({
        width: { size: width, type: WidthType.PERCENTAGE },
        shading,
        margins: { top: tw(5), bottom: tw(5), left: tw(6), right: tw(6) },
        children,
      });

      rows.push(new TableRow({
        children: [
          cell([para(String(idx + 1), { bold: true, size: size - 0.5, color: MUTED, after: 0 })], 7),
          cell([para(line.item || '—', { size, after: 0 })], 48),
          cell(detail, 45),
        ],
      }));
    });

    scope.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders, rows }));
    scope.push(spacer(14));
  }

  // ── Signatures ─────────────────────────────────────────────────────────────
  // Signature rules are cell borders, not drawn lines, so they stay put when the
  // homeowner's name runs long or a rep edits the block.

  const signatures: InstanceType<typeof Paragraph | typeof Table>[] = [];
  signatures.push(spacer(14));
  signatures.push(para(t.execution.replace('the date first above written', data.agreementDate), { after: 6 }));
  if (formal) signatures.push(para(`Dated: ${data.agreementDate}  (YYYY/MM/DD)`, { size: t.bodySize - 1, color: MUTED, after: 18 }));
  else signatures.push(spacer(14));

  const sigBlock = (name: string, role: string): InstanceType<typeof Paragraph>[] => [
    new Paragraph({
      spacing: { before: tw(22), after: tw(4) },
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: INK, space: 2 } },
      children: [],
    }),
    para(name || ' ', { bold: true, size: t.bodySize - 0.5, after: 1 }),
    para(role, { size: t.bodySize - 1.5, color: MUTED, after: 2 }),
    para('Date: ______________________', { size: t.bodySize - 2, after: 0 }),
  ];

  const sideBySide = (boxed: boolean) => new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: boxed ? boxBorders(RULE, 6) : noBorders,
    rows: [new TableRow({
      children: [
        new TableCell({
          width: { size: 48, type: WidthType.PERCENTAGE },
          margins: { top: tw(10), bottom: tw(10), left: tw(10), right: tw(16) },
          children: sigBlock(data.ownerName, 'Owner'),
        }),
        new TableCell({
          width: { size: 52, type: WidthType.PERCENTAGE },
          margins: { top: tw(10), bottom: tw(10), left: tw(16), right: tw(10) },
          children: sigBlock(data.contractorSignatory, `for ${data.contractorName}`),
        }),
      ],
    })],
  });

  switch (t.signatures) {
    case 'two-column':
      signatures.push(sideBySide(false));
      break;
    case 'boxed-pair':
      signatures.push(sideBySide(true));
      break;
    case 'rule-pair':
      signatures.push(...sigBlock(data.ownerName, 'OWNER'));
      signatures.push(spacer(24));
      signatures.push(...sigBlock(data.contractorSignatory, `FOR ${data.contractorName.toUpperCase()}`));
      break;
    case 'stacked-lines':
    default: {
      const party = (caption: string, role: string) => {
        signatures.push(para(caption, { after: 2 }));
        signatures.push(...sigBlock('', role));
        signatures.push(spacer(18));
      };
      party(`Per Name: ${data.ownerName || '—'}`, 'Owner');
      party(`${data.contractorName}   Per Name: ${data.contractorSignatory || '—'}`, 'Contractor');
      party('Witnessed by:', 'Witness');
      break;
    }
  }

  // ── Page furniture ─────────────────────────────────────────────────────────

  const pageNumber = (fmt: 'page-of' | 'slash' | 'plain') => {
    const children = [
      ...(fmt === 'page-of' ? [run('Page ', { size: 7.2, color: MUTED })] : []),
      new TextRun({ children: [PageNumber.CURRENT], font: face, size: hp(7.2), color: MUTED }),
      ...(fmt === 'plain' ? [] : [
        run(fmt === 'page-of' ? ' of ' : ' / ', { size: 7.2, color: MUTED }),
        new TextRun({ children: [PageNumber.TOTAL_PAGES], font: face, size: hp(7.2), color: MUTED }),
      ]),
    ];
    return children;
  };

  const footer = () => {
    switch (t.footer) {
      case 'centered-page':
        return new Footer({
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: pageNumber('page-of') })],
        });
      case 'minimal-right':
        return new Footer({
          children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: pageNumber('plain') })],
        });
      case 'rule-left':
        return new Footer({
          children: [new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: RULE, space: 6 } },
            tabStops: [{ type: D.TabStopType.RIGHT, position: tw(CONTENT_W) }],
            children: [
              run(`${data.contractorName} — Service Agreement\t`, { size: 7.2, color: MUTED }),
              ...pageNumber('slash'),
            ],
          })],
        });
      case 'boxed':
      default:
        return new Footer({
          children: [new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 5, color: RULE, space: 6 } },
            tabStops: [{ type: D.TabStopType.RIGHT, position: tw(CONTENT_W) }],
            children: [
              run(`${data.ownerName ? `${data.ownerName} — ${data.propertyAddress}` : data.contractorName}\t`,
                { size: 7.2, color: MUTED }),
              ...pageNumber('page-of'),
            ],
          })],
        });
    }
  };

  const runningHeader = () =>
    t.header === 'rail'
      ? undefined // Atlas keeps continuation pages bare, as it does in the PDF
      : new Header({
          children: [new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: RULE, space: 4 } },
            children: [run(
              t.id === 'meridian' ? 'HOME IMPROVEMENT SERVICE AGREEMENT' : 'Service Agreement',
              { bold: true, size: 7.5, color: MUTED },
            )],
          })],
        });

  const pageSetup = {
    page: {
      size: { width: tw(612), height: tw(792) },
      margin: {
        top: tw(t.margin.top),
        bottom: tw(t.margin.bottom),
        // Atlas's rail lived in the left margin; without it the margin can come
        // back in to the page-level measure.
        left: tw(t.header === 'rail' ? 90 : t.margin.left),
        right: tw(t.margin.right),
      },
    },
  };
  // Headers and footers hang off the section, not off its properties.
  const header = runningHeader();
  const furniture = () => ({ footers: { default: footer() }, ...(header ? { headers: { default: runningHeader()! } } : {}) });

  // ── Assembly ───────────────────────────────────────────────────────────────
  // Separate sections where the PDF changes page shape: the cover carries no
  // furniture, the clause body may run in two columns, and the scope table and
  // signatures always return to a single full-width column.

  type Section = ConstructorParameters<typeof Document>[0]['sections'][number];
  const sections: Section[] = [];

  if (coverChildren.length > 0) {
    sections.push({ properties: { ...pageSetup }, children: coverChildren });
  }

  const openingChildren = [
    ...(coverChildren.length > 0 ? [] : masthead),
    ...(coverChildren.length > 0 ? [] : title),
    ...parties,
  ];

  if (t.columns === 2) {
    // The masthead and parties span the measure; only the clauses run in columns.
    sections.push({ properties: { ...pageSetup }, ...furniture(), children: openingChildren });
    sections.push({
      properties: { ...pageSetup, type: D.SectionType.CONTINUOUS, column: { count: 2, space: tw(24) } },
      ...furniture(),
      children: body,
    });
    sections.push({
      properties: { ...pageSetup, type: D.SectionType.CONTINUOUS },
      ...furniture(),
      children: [...scope, ...(t.signaturePage ? [new Paragraph({ children: [], pageBreakBefore: true })] : []), ...signatures],
    });
  } else {
    sections.push({
      properties: { ...pageSetup },
      ...furniture(),
      children: [
        ...openingChildren,
        ...body,
        ...scope,
        ...(t.signaturePage ? [new Paragraph({ children: [], pageBreakBefore: true })] : []),
        ...signatures,
      ],
    });
  }

  const doc = new Document({
    creator: data.contractorName,
    title: `Home Improvement Service Agreement — ${data.ownerName || data.propertyAddress}`,
    description: 'Home improvement service agreement',
    styles: {
      // The default style carries the template's face and body size, so text a
      // rep types into the document matches what is already there.
      default: {
        document: { run: { font: face, size: hp(t.bodySize), color: INK } },
        heading1: { run: { font: face, bold: true, color: ACCENT }, paragraph: { spacing: { before: tw(12), after: tw(6) } } },
        heading2: { run: { font: face, bold: true, color: ACCENT } },
      },
    },
    numbering: {
      config: [{
        reference: 'contract-bullets',
        levels: [{
          level: 0,
          format: LevelFormat.BULLET,
          text: BULLET_CHAR[t.bullet] || '•',
          alignment: AlignmentType.LEFT,
          style: {
            run: { color: ACCENT, font: face },
            paragraph: { indent: { left: tw(20), hanging: tw(14) } },
          },
        }],
      }],
    },
    // docx embeds the regular weight; bold and the fallback are added below.
    ...(fonts ? { fonts: [{ name: face, data: fonts.regular as unknown as Buffer }] } : {}),
    sections,
  });

  const packed = await Packer.toBlob(doc);
  return fonts
    ? embedBoldAndFallback(packed, { boldFont: fonts.bold, fallback: identity.fallback })
    : packed;
}

/** Filename the Word agreement saves under — mirrors the PDF's. */
export function contractDocxFileName(d: ContractData): string {
  const safe = (s: string) => s.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'agreement';
  const date = d.agreementDate.replace(/\//g, '-');
  return `${safe(d.contractorName)}-service-agreement-${safe(d.ownerName)}-${date}.docx`;
}
