// ─── Font embedding for the Word agreement ───────────────────────────────────
//
// Word is not a web browser: it has no webfonts. If the .docx merely *names*
// EB Garamond, a homeowner without it installed sees Calibri, and all five
// templates collapse into the same document — the exact outcome the templates
// exist to prevent (see contractTemplates.ts).
//
// Word's own answer is font embedding (Options → Save → "Embed fonts in the
// file"): the TTF is stored inside the .docx as an "obfuscated font" part. We
// already carry the five faces for the PDF, all SIL Open Font License, which
// permits embedding.
//
// Two things the `docx` package can't express, which is why this module exists:
//
//   1. It embeds only the regular weight. Our agreements lean on bold for every
//      heading and label, so bold has to be embedded by hand or Word fakes it by
//      smearing the regular — visibly poor on the serif templates.
//   2. It can't declare an alternate font. `w:altName` is what Word falls back
//      to when it won't use the embedded copy (notably Word for Mac and Word on
//      the web, which largely ignore embedded fonts). Without it those fall to a
//      default rather than to the substitute we picked deliberately.
//
// So we let `docx` embed the regular weight, then patch the finished package:
// add the bold part, and declare the fallback.

import type { ContractFontFamily } from './contractFonts';

/**
 * The family name written into the document, and the face Word should use if it
 * declines the embedded copy.
 *
 * The embedded files' own name tables are unreliable — they were instanced from
 * variable fonts and several still report "Regular" or "ExtraLight" regardless
 * of the weight they actually contain. That doesn't affect rendering (the
 * outlines are correct, and Word binds the face through the font table, not the
 * internal name), but it is why these names are declared here rather than read
 * out of the files.
 */
export const FONT_IDENTITY: Record<ContractFontFamily, { family: string; fallback: string }> = {
  EBGaramond: { family: 'EB Garamond', fallback: 'Garamond' },
  IBMPlexSerif: { family: 'IBM Plex Serif', fallback: 'Cambria' },
  Manrope: { family: 'Manrope', fallback: 'Segoe UI' },
  Karla: { family: 'Karla', fallback: 'Arial' },
  Nunito: { family: 'Nunito', fallback: 'Trebuchet MS' },
};

export type FontPair = { regular: Uint8Array; bold: Uint8Array };

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

/**
 * The regular and bold TTFs for a family, or null if the font chunk won't load.
 * Callers fall back to naming the substitute face directly.
 */
export async function loadFontPair(family: ContractFontFamily): Promise<FontPair | null> {
  try {
    const { CONTRACT_FONT_DATA } = await import('./contractFontData');
    const data = CONTRACT_FONT_DATA as Record<string, string>;
    const regular = data[`${family}|normal`];
    const bold = data[`${family}|bold`];
    if (!regular || !bold) return null;
    return { regular: base64ToBytes(regular), bold: base64ToBytes(bold) };
  } catch {
    return null;
  }
}

/**
 * ECMA-376's font obfuscation: the first 32 bytes are XORed with the part's
 * GUID, written back to front. Not encryption — it exists so embedded fonts
 * aren't trivially extracted and installed. Word rejects a font part that
 * hasn't been through it.
 */
function obfuscate(font: Uint8Array, guid: string): Uint8Array {
  const key = guid.replace(/-/g, '');
  const bytes = (key.match(/../g) ?? []).map((h) => parseInt(h, 16)).reverse();
  const out = new Uint8Array(font);
  for (let i = 0; i < 32 && i < out.length; i += 1) out[i] = font[i] ^ bytes[i % bytes.length];
  return out;
}

/** RFC-4122-shaped id. Word only requires that it matches the font part. */
function uuid(): string {
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

const dec = new TextDecoder();
const enc = new TextEncoder();

/**
 * Add the bold weight and the fallback declaration to a packed .docx.
 *
 * `docx` has already embedded the regular weight, its relationship and the
 * odttf content-type default, so this only has to add what it left out. Returns
 * the original blob untouched if the package isn't shaped as expected — a
 * document with a substituted font beats no document at all.
 */
export async function embedBoldAndFallback(
  blob: Blob,
  opts: { boldFont: Uint8Array; fallback: string },
): Promise<Blob> {
  const { unzipSync, zipSync } = await import('fflate');

  try {
    const files = unzipSync(new Uint8Array(await blob.arrayBuffer()));
    const tablePath = 'word/fontTable.xml';
    const relsPath = 'word/_rels/fontTable.xml.rels';
    if (!files[tablePath] || !files[relsPath]) return blob;

    let table = dec.decode(files[tablePath]);
    let rels = dec.decode(files[relsPath]);

    // Slot the bold part in after the regular one docx already wrote.
    const used = [...rels.matchAll(/Id="rId(\d+)"/g)].map((m) => Number(m[1]));
    const relId = `rId${Math.max(0, ...used) + 1}`;
    // Number off the parts that exist, not the entries in the archive — fflate
    // reports the `word/fonts/` directory itself, which would skip a number.
    const taken = Object.keys(files)
      .map((f) => /^word\/fonts\/font(\d+)\.odttf$/.exec(f))
      .map((m) => (m ? Number(m[1]) : 0));
    const partName = `fonts/font${Math.max(0, ...taken) + 1}.odttf`;
    const guid = uuid();

    rels = rels.replace(
      '</Relationships>',
      `<Relationship Id="${relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/font" Target="${partName}"/></Relationships>`,
    );

    // w:embedBold follows w:embedRegular; w:altName leads the element. Both
    // positions are fixed by the schema — Word rejects the file if they aren't
    // in order, so these are anchored rather than appended.
    const embedRegular = /(<w:embedRegular[^>]*\/>)/;
    if (!embedRegular.test(table)) return blob;
    table = table.replace(
      embedRegular,
      `$1<w:embedBold r:id="${relId}" w:fontKey="{${guid}}"/>`,
    );
    table = table.replace(/(<w:font w:name="[^"]*">)/, `$1<w:altName w:val="${opts.fallback}"/>`);

    files[`word/${partName}`] = obfuscate(opts.boldFont, guid);
    files[tablePath] = enc.encode(table);
    files[relsPath] = enc.encode(rels);

    return new Blob([zipSync(files) as unknown as BlobPart], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
  } catch {
    return blob;
  }
}
