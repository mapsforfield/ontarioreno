/**
 * Internal-note history — why this exists
 * ───────────────────────────────────────
 * Internal notes are effectively ONE blob per homeowner: an edit on a
 * consultation is synced down to `Client.internalNotes`, and an edit on the
 * client profile is fanned back OUT to every consultation with that email.
 * Every one of those writes used to be a plain overwrite.
 *
 * So a repeat customer lost their history. A new booking creates a fresh
 * appointment whose `internalNotes` is only the freshly-submitted form brief;
 * the first time the rep saved that consultation, the brief overwrote the
 * client profile, and the fan-out then stamped it over the earlier
 * consultations too. Everything the rep knew about the customer from the last
 * visit was gone, and nothing in the UI said it had ever been there.
 *
 * The rule now: notes are only ever ADDED to. A new booking's brief is stacked
 * ON TOP of what was already on file, under a dated divider, and every sync
 * path merges instead of replacing.
 */

const DIVIDER = '─'.repeat(34);

/** Toronto-local YYYY-MM-DD, so a divider never reads a day off. */
export function torontoDateStamp(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

function normalise(text: string): string {
  return text.replace(/\r\n/g, '\n').trim();
}

/** Whitespace-insensitive containment, so a re-save is not read as new text. */
function contains(haystack: string, needle: string): boolean {
  const flat = (s: string) => s.replace(/\s+/g, ' ').trim();
  const n = flat(needle);
  return n.length > 0 && flat(haystack).includes(n);
}

export function historyHeader(label: string, stamp = torontoDateStamp()): string {
  return `${DIVIDER}\n${label} · ${stamp}\n${DIVIDER}`;
}

/**
 * Merge an incoming note over what is already on file, keeping both.
 *
 * Returns `incoming` unchanged when there is nothing to preserve — when the
 * existing text is empty, or is already part of the incoming text (the normal
 * case: a rep edits the notes they were shown, which already carry the
 * history). Only genuinely-unseen prior text is pushed down under a divider.
 */
export function mergeNotes(
  existing: string | null | undefined,
  incoming: string | null | undefined,
  options: { label?: string; stamp?: string } = {}
): string {
  const prior = normalise(existing ?? '');
  const next = normalise(incoming ?? '');
  if (!prior) return next;
  if (!next) return prior;
  if (contains(next, prior)) return next;
  // The rep deleted text rather than adding any: nothing new to stack.
  if (contains(prior, next)) return prior;
  const label = options.label ?? 'PREVIOUS NOTES';
  return `${next}\n\n${historyHeader(label, options.stamp ?? torontoDateStamp())}\n${prior}`;
}

/**
 * The `internalNotes` a NEW consultation starts life with: this booking's
 * brief, with everything already on file for this homeowner stacked beneath
 * it. The rep opens the prep sheet and sees the new job first, then what they
 * dealt with last time.
 */
export function seedBookingNotes(
  brief: string,
  priorNotes: string | null | undefined,
  options: { stamp?: string } = {}
): string {
  return mergeNotes(priorNotes, brief, {
    label: 'EARLIER CONSULTATIONS — history before this booking',
    stamp: options.stamp,
  });
}
