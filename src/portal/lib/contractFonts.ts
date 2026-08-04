// ─── Contract typefaces ──────────────────────────────────────────────────────
//
// jsPDF ships three usable families (Helvetica, Times, Courier), which is why
// the first pass at these templates all read as the same document wearing
// different colours — typography is the strongest signal that two contracts
// came from different companies, and we had none of it.
//
// These five faces are deliberately drawn from different classifications so no
// two templates share a voice:
//
//   EB Garamond   old-style serif      → Meridian  (traditional legal)
//   IBM Plex Serif transitional serif  → Sterling  (institutional/corporate)
//   Manrope       geometric sans       → Vertex    (modern branded)
//   Karla         grotesque sans       → Atlas     (minimal editorial)
//   Nunito        rounded sans         → Harbor    (contemporary, friendly)
//
// All SIL Open Font License 1.1 — free for commercial use, no attribution
// required in the output document.

import { jsPDF } from 'jspdf';

export type ContractFontFamily = 'EBGaramond' | 'IBMPlexSerif' | 'Manrope' | 'Karla' | 'Nunito';

let registered = false;
let pending: Promise<boolean> | null = null;

/**
 * Load and register the embedded typefaces. Safe to call repeatedly — the work
 * happens once and every later call resolves against the same promise.
 *
 * Resolves false if the chunk fails to load; templates fall back to their
 * built-in stand-in rather than failing to render.
 */
export function ensureContractFonts(): Promise<boolean> {
  if (registered) return Promise.resolve(true);
  if (!pending) {
    pending = import('./contractFontData')
      .then(({ CONTRACT_FONT_DATA }) => {
        // jsPDF resolves fonts per-document, so we hook document creation and
        // install the whole set into each new instance's virtual filesystem.
        jsPDF.API.events.push([
          'addFonts',
          function addContractFonts(this: jsPDF) {
            for (const [key, base64] of Object.entries(CONTRACT_FONT_DATA)) {
              const [family, style] = key.split('|');
              const file = `${family}-${style}.ttf`;
              this.addFileToVFS(file, base64);
              this.addFont(file, family, style);
            }
          } as never,
        ]);
        registered = true;
        return true;
      })
      .catch(() => {
        pending = null; // allow a later retry
        return false;
      });
  }
  return pending;
}

/** Whether the embedded faces are available to the next document. */
export function contractFontsReady(): boolean {
  return registered;
}
