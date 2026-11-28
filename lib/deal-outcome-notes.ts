/**
 * A consultation's outcome report belongs on its deal.
 *
 * Deals used to be created from the "Create deal" button, usually AFTER the
 * visit, so the rep's notes were already there. Since every booking gets a
 * deal automatically (lib/deal-from-appointment.ts), the deal is created
 * BEFORE the visit — and the outcome report a rep files afterwards updated the
 * amount and stage but never the notes. Hossein's deal read "Booked through
 * the public Basement Renovation Consultation flow" while the rep's account of
 * the visit (quoted 50k, settled 44k, half financed) sat only on the
 * consultation.
 *
 * Rules:
 * - The outcome sits on top of the deal's notes under its own dated header,
 *   with whatever was already there kept below. Nothing is ever dropped.
 * - Editing the outcome replaces the earlier wording in place, rather than
 *   stacking a second copy.
 * - An empty outcome never clears anything.
 * - Pure: the portal store and the appointment PATCH both call it, so the two
 *   writes agree.
 */
import { historyHeader } from './consultation-notes.js';

const flat = (s: string) => s.replace(/\s+/g, ' ').trim();
const containsLoose = (haystack: string, needle: string) => {
  const n = flat(needle);
  return n.length > 0 && flat(haystack).includes(n);
};

export function outcomeNotesHeader(visitDate: string | null | undefined): string {
  return historyHeader('OUTCOME REPORT', visitDate || 'consultation');
}

export function withOutcomeNotes(
  dealNotes: string | null | undefined,
  outcomeNotes: string | null | undefined,
  opts: { previousOutcomeNotes?: string | null; visitDate?: string | null } = {}
): string {
  const base = String(dealNotes ?? '').replace(/\r\n/g, '\n').trim();
  const next = String(outcomeNotes ?? '').replace(/\r\n/g, '\n').trim();
  if (!next) return base;
  if (containsLoose(base, next)) return base;

  const prev = String(opts.previousOutcomeNotes ?? '').replace(/\r\n/g, '\n').trim();
  if (prev && base.includes(prev)) return base.replace(prev, next);

  const block = `${outcomeNotesHeader(opts.visitDate)}\n${next}`;
  return base ? `${block}\n\n${base}` : block;
}
