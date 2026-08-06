// ─── Closure detection for watched (published) grant programs ─────────────────
// Pure, testable logic. The scanner (lib/grants.ts) fetches; this module decides
// whether what came back means the program has closed.
//
// Precision matters more than recall here: a false "closed" pulls a live program
// off the public /grants page or wastes a confirmation. So every signal carries
// the EVIDENCE that produced it, and only a passed deadline — the one signal that
// is a fact rather than an inference — is allowed to change the public page
// automatically. Everything else is flagged for a human.

export type ClosureSignalKind =
  | 'http-gone'          // page 404/410/gone — the program's own page is off the site
  | 'closure-language'   // the page says it is closed / not accepting / exhausted
  | 'link-removed'       // the application link we recorded is no longer on the page
  | 'deadline-passed';   // scraped deadline is earlier than today

export type ClosureSignal = {
  kind: ClosureSignalKind;
  /** Short human sentence naming what was found, for the alert and the portal. */
  detail: string;
};

/** The only signal allowed to change the public page without a human. */
export const AUTO_DOWNGRADE_SIGNAL: ClosureSignalKind = 'deadline-passed';

/** Public status shown when a program is auto-downgraded on a passed deadline. */
export const CHECK_STATUS_LABEL = 'Check status';

// ─── Closure language ─────────────────────────────────────────────────────────
// "closed" alone is far too loose — municipal pages say "closed" about offices,
// holidays, and road closures. Each pattern below requires program context, so a
// match is about the PROGRAM's intake, not the building's hours.
const CLOSURE_PATTERNS: Array<{ kind: string; re: RegExp }> = [
  { kind: 'no longer accepting', re: /\b(?:no longer|not currently|are not|is not)\s+(?:being\s+)?accept(?:ing|ed)\b[^.]{0,60}/i },
  // Leading context is captured on purpose: "open until funds are exhausted"
  // describes a LIVE program, and the negator below can only see it if the
  // excerpt includes the words in front of the funding term.
  { kind: 'funding exhausted', re: /[^.]{0,60}\b(?:funding|funds|budget|allocation)\b[^.]{0,40}?\b(?:fully\s+)?(?:exhausted|depleted)\b[^.]{0,40}/i },
  { kind: 'funding exhausted', re: /[^.]{0,60}\b(?:funding|funds|budget|allocation)\b[^.]{0,40}?\bfully\s+(?:committed|allocated|subscribed)\b[^.]{0,40}/i },
  { kind: 'fully subscribed', re: /\bfully\s+subscribed\b[^.]{0,60}/i },
  { kind: 'waitlist', re: /\b(?:wait[\s-]?list(?:ed)?|waiting list)\b[^.]{0,60}/i },
  // "closed" only when it is clearly the program/intake that closed.
  { kind: 'closed', re: /\b(?:program|programme|intake|application|applications|submissions|funding|stream|window|round)\s+(?:is |are |has |have |now |currently |been |temporarily )*clos(?:ed|ing)\b[^.]{0,60}/i },
  { kind: 'closed', re: /\b(?:now|currently|permanently|temporarily)\s+closed\b[^.]{0,60}/i },
  { kind: 'closed', re: /\bclosed\s+(?:to|for)\s+(?:new\s+)?(?:applications|applicants|intake|submissions)\b[^.]{0,60}/i },
  { kind: 'closed', re: /\bthis\s+(?:program|programme|intake|funding)\b[^.]{0,80}?\bclosed\b/i },
  { kind: 'closed', re: /\bapplications?\s+clos(?:ed|es|ing)\b[^.]{0,60}/i },
];

// Phrases that use closure words but mean the program is OPEN, or describe a past
// round while a new one runs. Checked against the matched excerpt, not the page,
// so one reassuring sentence elsewhere can't mask a real closure.
const CLOSURE_NEGATORS =
  /\b(?:will\s+close|closes\s+on|closing\s+date|closes\s+at|until\s+closed|before\s+(?:it\s+)?closes|reopen(?:ed|s|ing)?|has\s+reopened|next\s+intake|previous(?:ly)?\s+closed|last\s+(?:intake|round)\s+closed|open\s+until|until\s+(?:the\s+)?(?:funds|funding|budget)|while\s+funds\s+last|once\s+the|subject\s+to|if\s+(?:the\s+)?funds)\b/i;

/**
 * Find closure language in page text. Returns every distinct signal found, each
 * carrying the sentence fragment that triggered it so a human can judge it.
 */
export function detectClosureLanguage(text: string): ClosureSignal[] {
  const found = new Map<string, ClosureSignal>();
  for (const { kind, re } of CLOSURE_PATTERNS) {
    const m = text.match(re);
    if (!m) continue;
    const excerpt = m[0].trim().replace(/\s+/g, ' ').slice(0, 160);
    // A "closes on June 1" style match is a live deadline, not a closure.
    if (CLOSURE_NEGATORS.test(excerpt)) continue;
    if (!found.has(kind)) found.set(kind, { kind: 'closure-language', detail: `Page says “${excerpt}” (${kind})` });
  }
  return [...found.values()];
}

// ─── Application link removed ─────────────────────────────────────────────────
const APPLY_HINT = /apply|application|register|submit|intake|portal|form/i;

/**
 * True when the specific application URL we recorded for this program is no
 * longer linked from the page AND the page has no apply-style link at all.
 *
 * Both halves are required: municipal sites reshuffle URLs constantly, so a
 * missing exact href on a page that still has an obvious "Apply now" link is a
 * move, not a closure. Returns false when we have no HTML to inspect, so a
 * fetch quirk never manufactures a signal.
 */
export function detectApplicationLinkRemoved(html: string, recordedApplyUrl: string): boolean {
  if (!html || html.length < 200) return false;
  const hrefs = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]{0,200}?)<\/a>/gi)];
  if (hrefs.length === 0) return false; // no links parsed — not evidence of anything

  if (recordedApplyUrl) {
    const needle = recordedApplyUrl.split('#')[0].split('?')[0].toLowerCase();
    const stillLinked = hrefs.some((h) => h[1].toLowerCase().includes(needle) || needle.includes(h[1].toLowerCase().split('#')[0].split('?')[0]));
    if (stillLinked) return false;
  }
  // The recorded URL is gone (or we never had one). Only call it removed when the
  // page also offers no apply-style link of any kind.
  const hasApplyLink = hrefs.some((h) => APPLY_HINT.test(h[1]) || APPLY_HINT.test(h[2].replace(/<[^>]+>/g, ' ')));
  return !hasApplyLink;
}

// ─── Deadline parsing ─────────────────────────────────────────────────────────
const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

// Free text that explicitly means "there is no fixed end date". Must not parse to
// a date — an open-ended program should never be auto-downgraded.
const OPEN_ENDED =
  /\b(?:ongoing|continuous|rolling|no\s+deadline|open\s+until\s+(?:funds|funding|budget)|while\s+funds\s+last|until\s+(?:funds|funding)\s+(?:are\s+|is\s+)?(?:exhausted|depleted)|first[\s-]come|indefinite|n\/?a|tbd|unknown)\b/i;

const monthNum = (s: string): number | undefined => MONTHS[s.slice(0, 3).toLowerCase()];
const utc = (y: number, m: number, d: number): Date => new Date(Date.UTC(y, m, d, 12, 0, 0));
const lastDayOfMonth = (y: number, m: number): number => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();

/**
 * Parse the free-text `deadline` field into a date, or null when it states no
 * fixed end (or we can't read it confidently).
 *
 * Deliberately conservative in two ways:
 *  • A month/year with no day resolves to the LAST day of that month, and a bare
 *    year to Dec 31 — so we never call a deadline passed early.
 *  • Anything unrecognised returns null rather than a guess.
 */
export function parseDeadlineDate(raw: string): Date | null {
  const text = (raw ?? '').trim();
  if (!text) return null;
  if (OPEN_ENDED.test(text)) return null;

  // 2025-12-31 / 2025/12/31
  const iso = text.match(/\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b/);
  if (iso) {
    const m = Number(iso[2]) - 1, d = Number(iso[3]);
    if (m >= 0 && m <= 11 && d >= 1 && d <= 31) return utc(Number(iso[1]), m, d);
  }

  // December 31, 2025 / Dec. 31 2025
  const mdy = text.match(/\b([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(20\d{2})\b/);
  if (mdy) {
    const m = monthNum(mdy[1]);
    if (m !== undefined) return utc(Number(mdy[3]), m, Number(mdy[2]));
  }

  // 31 December 2025
  const dmy = text.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})\.?,?\s+(20\d{2})\b/);
  if (dmy) {
    const m = monthNum(dmy[2]);
    if (m !== undefined) return utc(Number(dmy[3]), m, Number(dmy[1]));
  }

  // December 2025 — no day stated, so give it the whole month.
  const my = text.match(/\b([A-Za-z]{3,9})\.?\s+(20\d{2})\b/);
  if (my) {
    const m = monthNum(my[1]);
    if (m !== undefined) return utc(Number(my[2]), m, lastDayOfMonth(Number(my[2]), m));
  }

  // A bare year — give it to Dec 31.
  const y = text.match(/\b(20\d{2})\b/);
  if (y) return utc(Number(y[1]), 11, 31);

  return null;
}

/** True when a scraped deadline resolves to a date strictly before today. */
export function isDeadlinePassed(rawDeadline: string, now: Date = new Date()): boolean {
  const d = parseDeadlineDate(rawDeadline);
  if (!d) return false;
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 0, 0);
  return d.getTime() < today;
}

// ─── Combined ─────────────────────────────────────────────────────────────────
export type ScanObservation = {
  /** HTTP status, or 0 when the request never completed. */
  httpStatus: number;
  /** Error message when the fetch threw. */
  fetchError?: string;
  /** Visible page text (empty when the fetch failed). */
  text: string;
  /** Raw HTML, for link inspection (empty when unavailable). */
  html: string;
};

export type WatchedProgram = {
  name: string;
  deadline: string;
  /** The application/source URL we recorded for this program. */
  sourceUrl: string;
};

/**
 * Every closure signal this observation raises for this program. Empty means the
 * program still looks live.
 */
export function detectClosureSignals(
  program: WatchedProgram,
  obs: ScanObservation,
  now: Date = new Date(),
): ClosureSignal[] {
  const signals: ClosureSignal[] = [];

  // A page that is gone outranks everything else — there is nothing left to read.
  if (obs.httpStatus === 404 || obs.httpStatus === 410) {
    signals.push({ kind: 'http-gone', detail: `Official page returns HTTP ${obs.httpStatus} — the program page has been removed.` });
    // Still worth checking the deadline we already hold on file.
    if (isDeadlinePassed(program.deadline, now)) {
      signals.push({ kind: 'deadline-passed', detail: `Recorded deadline “${program.deadline}” is in the past.` });
    }
    return signals;
  }

  // Any other failed fetch is an outage, not a closure. Do not guess.
  if (obs.fetchError || !obs.text) {
    if (isDeadlinePassed(program.deadline, now)) {
      signals.push({ kind: 'deadline-passed', detail: `Recorded deadline “${program.deadline}” is in the past.` });
    }
    return signals;
  }

  signals.push(...detectClosureLanguage(obs.text));

  if (detectApplicationLinkRemoved(obs.html, program.sourceUrl)) {
    signals.push({ kind: 'link-removed', detail: 'The application link we recorded is gone and the page offers no apply link.' });
  }

  if (isDeadlinePassed(program.deadline, now)) {
    signals.push({ kind: 'deadline-passed', detail: `Scraped deadline “${program.deadline}” is earlier than today.` });
  }

  return signals;
}

/** A passed deadline downgrades the public page on its own; nothing else does. */
export function shouldAutoDowngrade(signals: ClosureSignal[]): boolean {
  return signals.some((s) => s.kind === AUTO_DOWNGRADE_SIGNAL);
}

/** Stable summary string stored on the program and shown in the portal lane. */
export function summarizeSignals(signals: ClosureSignal[]): string {
  return signals.map((s) => s.detail).join(' • ').slice(0, 500);
}

/** Sorted, deduped signal kinds — stored so the lane can filter and the alert
 *  can stay idempotent for an unchanged set of findings. */
export function signalKeys(signals: ClosureSignal[]): string {
  return [...new Set(signals.map((s) => s.kind))].sort().join(',');
}
