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
  /** How much this finding is worth. Below `medium` it is never reported. */
  confidence?: ClosureConfidence;
  /** Which phrase family matched, for closure-language signals. */
  matchedKind?: string;
  /** Where the phrase was found — a status banner outranks body copy. */
  placement?: ClosurePlacement;
};

/** The only signal allowed to change the public page without a human. */
export const AUTO_DOWNGRADE_SIGNAL: ClosureSignalKind = 'deadline-passed';

/** Public status shown when a program is auto-downgraded on a passed deadline. */
export const CHECK_STATUS_LABEL = 'Check status';

// ─── Closure language ─────────────────────────────────────────────────────────
// Three safeguards stand between page text and a "closed" flag, because a false
// positive pulls a live program off the public /grants page:
//
//   1. Patterns require an EXPLICIT termination phrase — a program-scoped subject
//      ("intake", "funding", "applications") bound to a completed state ("is
//      closed", "has been exhausted"). A bare "closed" or a floating "exhausted"
//      never matches on its own.
//   2. Exclusions are tested against the WHOLE SENTENCE around the match, not a
//      truncated excerpt. This is what the Belleville false positive turned on:
//      "Funding is available until the program budget is exhausted, and
//      applications are reviewed on a first-come, first-served basis" is an
//      allocation RULE, and the disqualifying "until …" sits two words away from
//      the funding term — far enough that the old excerpt-level check missed it.
//   3. Findings carry a confidence. Only an explicit phrase, or placement in a
//      status banner / alert / callout / heading, clears the bar. Suggestive
//      wording buried in body copy scores low and is dropped, not flagged.

export type ClosureConfidence = 'high' | 'medium' | 'low';

/** Where in the document the phrase was found. Status banners outrank body copy. */
export type ClosurePlacement = 'prominent' | 'body';

/** Findings below this are dropped rather than raised to a human. */
export const CLOSURE_CONFIDENCE_THRESHOLD: ClosureConfidence = 'medium';

const CONFIDENCE_RANK: Record<ClosureConfidence, number> = { low: 0, medium: 1, high: 2 };

type ClosurePattern = {
  kind: string;
  re: RegExp;
  /** An unambiguous termination phrase — trustworthy even in generic body copy. */
  explicit: boolean;
};

const CLOSURE_PATTERNS: ClosurePattern[] = [
  // ── Explicit termination phrases ────────────────────────────────────────────
  // Each binds a program-scoped SUBJECT to a state VERB, so "closed" is never
  // read off a road closure or "City Hall is closed on statutory holidays".
  {
    kind: 'closed',
    explicit: true,
    re: /\b(?:the\s+|this\s+)?(?:program|programme|intake|applications?|submissions?|funding|stream|window|round|portal)\s+(?:is|are|was|were|has\s+been|have\s+been)\s+(?:now\s+|currently\s+|permanently\s+|temporarily\s+)?closed\b[^.]{0,60}/i,
  },
  {
    kind: 'closed',
    explicit: true,
    re: /\bclosed\s+(?:to|for)\s+(?:new\s+|further\s+|additional\s+)?(?:applications|applicants|intake|submissions|registrations)\b[^.]{0,60}/i,
  },
  {
    kind: 'closed',
    explicit: true,
    re: /\bapplications?\s+(?:has\s+|have\s+)?clos(?:ed|es)\b[^.]{0,60}/i,
  },
  {
    kind: 'no longer accepting',
    explicit: true,
    re: /\b(?:no\s+longer|not\s+currently|are\s+not|is\s+not|will\s+not\s+be)\s+(?:being\s+)?accept(?:ing|ed)\b[^.]{0,60}/i,
  },
  {
    kind: 'funding exhausted',
    explicit: true,
    // "the budget HAS BEEN exhausted" — a completed state. The conditional form
    // ("until the budget is exhausted") is stripped by the sentence exclusions.
    re: /\b(?:funding|funds|budget|allocation)\s+(?:for\s+[^.]{0,40}?\s+)?(?:has\s+been|have\s+been|is|are|was|were)\s+(?:now\s+)?(?:fully\s+)?(?:exhausted|depleted|allocated|committed|expended|spent)\b[^.]{0,40}/i,
  },
  {
    kind: 'fully subscribed',
    explicit: true,
    re: /\b(?:the\s+|this\s+)?(?:program|programme|intake|round|applications?|funding|stream)\s+(?:is|are|was|were|has\s+been|have\s+been)\s+fully\s+subscribed\b[^.]{0,40}/i,
  },
  {
    kind: 'waitlist',
    explicit: true,
    re: /\b(?:applicants?|applications?|homeowners?|residents?)\s+(?:are|is|will\s+be|being)\b[^.]{0,40}?\b(?:wait[\s-]?list(?:ed)?|waiting\s+list)\b[^.]{0,40}/i,
  },

  // ── Suggestive only ─────────────────────────────────────────────────────────
  // Real closure wording, but too loose to trust in the middle of body copy.
  // Flagged ONLY when it appears in a status banner, alert, callout or heading —
  // somewhere a page STATES its status rather than describes how funds are spent.
  { kind: 'closed', explicit: false, re: /\b(?:now|currently|permanently|temporarily)\s+closed\b[^.]{0,60}/i },
  { kind: 'closed', explicit: false, re: /\bclos(?:ed|ing)\b[^.]{0,60}/i },
  { kind: 'fully subscribed', explicit: false, re: /\bfully\s+subscribed\b[^.]{0,60}/i },
  { kind: 'waitlist', explicit: false, re: /\b(?:wait[\s-]?list(?:ed)?|waiting\s+list)\b[^.]{0,60}/i },
  { kind: 'funding exhausted', explicit: false, re: /\b(?:funding|funds|budget)\b[^.]{0,40}?\b(?:exhausted|depleted)\b[^.]{0,40}/i },
];

// Phrases that use closure words but describe a LIVE program — an allocation or
// eligibility RULE, a future closing date, or a past round beside a current one.
//
// Tested against the whole sentence, so the disqualifying words need not sit next
// to the closure term. The conditional branch allows a couple of intervening
// words ("until the PROGRAM budget", "unless the ANNUAL funding") — pinning it to
// "until the budget" is exactly the gap the Belleville page fell through.
const CLOSURE_NEGATORS =
  /\b(?:will\s+close|will\s+be\s+closed|closes\s+on|closing\s+date|closes\s+at|until\s+closed|before\s+(?:it\s+)?closes|reopen(?:ed|s|ing)?|has\s+reopened|next\s+intake|previous(?:ly)?\s+closed|last\s+(?:intake|round)\s+closed|open\s+until|available\s+until|accepted\s+until|(?:until|unless|if|while|once|when|should|provided)\s+(?:the\s+|its\s+|all\s+|any\s+)?(?:\S+\s+){0,2}?(?:funds|funding|budget|allocation|money|dollars)\b|while\s+(?:funds|funding|budget|supplies)\s+last|once\s+the|subject\s+to|if\s+(?:the\s+)?funds|first[\s-]?come|first[\s-]?served|on\s+a\s+first)\b/i;

/** The sentence containing a match, so exclusions see the full clause. */
function enclosingSentence(text: string, index: number, length: number): string {
  const from = Math.max(0, index - 400);
  const before = text.slice(from, index);
  const startRel = Math.max(
    before.lastIndexOf('. '), before.lastIndexOf('! '), before.lastIndexOf('? '),
    before.lastIndexOf('\n'), before.lastIndexOf('•'),
  );
  const start = startRel === -1 ? from : from + startRel + 1;
  const rest = text.slice(index + length, index + length + 400);
  const endRel = rest.search(/[.!?\n•]/);
  const end = index + length + (endRel === -1 ? rest.length : endRel + 1);
  return text.slice(start, end).replace(/\s+/g, ' ').trim();
}

/** Highest-confidence finding wins when the same phrase family matches twice. */
function keepStrongest(found: Map<string, ClosureSignal>, signal: ClosureSignal): void {
  const key = signal.matchedKind ?? signal.detail;
  const prior = found.get(key);
  if (prior && CONFIDENCE_RANK[prior.confidence ?? 'medium'] >= CONFIDENCE_RANK[signal.confidence ?? 'medium']) return;
  found.set(key, signal);
}

/**
 * Find closure language in a block of text.
 *
 * `placement` says where the text came from: 'prominent' for a status banner,
 * alert, callout or heading; 'body' (the default) for general page copy. Only
 * explicit termination phrases are trusted in body copy — suggestive wording
 * there scores 'low' and is dropped.
 *
 * Every returned signal carries the fragment that triggered it, so a human can
 * judge the call.
 */
export function detectClosureLanguage(
  text: string,
  placement: ClosurePlacement = 'body',
): ClosureSignal[] {
  if (!text) return [];
  const found = new Map<string, ClosureSignal>();

  for (const { kind, re, explicit } of CLOSURE_PATTERNS) {
    const m = text.match(re);
    if (!m || m.index === undefined) continue;

    // Exclusions run against the whole sentence, not the matched fragment.
    if (CLOSURE_NEGATORS.test(enclosingSentence(text, m.index, m[0].length))) continue;

    // explicit + banner → high · explicit in body, or loose in a banner → medium
    // loose wording in body copy → low, and low never leaves this function.
    const confidence: ClosureConfidence =
      explicit && placement === 'prominent' ? 'high'
        : explicit || placement === 'prominent' ? 'medium'
          : 'low';
    if (CONFIDENCE_RANK[confidence] < CONFIDENCE_RANK[CLOSURE_CONFIDENCE_THRESHOLD]) continue;

    const excerpt = m[0].trim().replace(/\s+/g, ' ').slice(0, 160);
    const where = placement === 'prominent' ? 'Status banner says' : 'Page says';
    keepStrongest(found, {
      kind: 'closure-language',
      matchedKind: kind,
      confidence,
      placement,
      detail: `${where} “${excerpt}” (${kind})`,
    });
  }
  return [...found.values()];
}

// ─── Targeted DOM scoping ─────────────────────────────────────────────────────
// A program that has actually closed says so where a reader cannot miss it. These
// are the containers that carry a STATUS rather than describe the rules.
const PROMINENT_CLASS =
  /(?:^|[\s"'_-])(?:status|state|alert|banner|callout|notice|badge|message|warning|danger|important|highlight|closed)(?:[\s"'_-]|$)/i;

const BLOCK_TAGS = 'div|section|aside|p|span|strong|em|li|td|th|header';

const stripTags = (html: string): string =>
  html.replace(/<(?:script|style)\b[^>]*>[\s\S]*?<\/(?:script|style)>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();

const attr = (attrs: string, name: string): string =>
  (attrs.match(new RegExp(`\\b${name}=["']([^"']*)["']`, 'i')) ?? [])[1] ?? '';

/**
 * Pull the text of status-bearing regions out of raw HTML: headings, elements
 * whose class/id/role marks them as a status, alert, banner, badge or callout,
 * and the description/status meta tags.
 *
 * Returns '' when there is no HTML to read, which simply means every finding is
 * judged as body copy — never that something is more certain than it is.
 */
export function extractProminentText(html: string): string {
  if (!html) return '';
  const parts: string[] = [];

  for (const m of html.matchAll(/<(h[1-3])\b[^>]*>([\s\S]{0,400}?)<\/\1>/gi)) parts.push(stripTags(m[2]));

  for (const m of html.matchAll(/<meta\b[^>]*?(?:name|property)=["'][^"']*(?:description|status)[^"']*["'][^>]*>/gi)) {
    parts.push(stripTags(attr(m[0], 'content')));
  }

  for (const m of html.matchAll(new RegExp(`<(${BLOCK_TAGS})\\b([^>]*)>`, 'gi'))) {
    const attrs = m[2];
    const role = attr(attrs, 'role');
    const marked = role === 'alert' || role === 'status'
      || PROMINENT_CLASS.test(attr(attrs, 'class'))
      || PROMINENT_CLASS.test(attr(attrs, 'id'));
    if (!marked || m.index === undefined) continue;
    // A flat slice rather than true nesting: we only need the wording, and an
    // over-long slice is trimmed back to the sentence around any match anyway.
    const from = m.index + m[0].length;
    parts.push(stripTags(html.slice(from, from + 600)));
  }

  return parts.filter(Boolean).join('. ').slice(0, 4000);
}

/**
 * Closure language across a whole page: status regions first — where a real
 * closure is announced — then body copy under the stricter explicit-phrase bar.
 */
export function detectPageClosureLanguage(text: string, html = ''): ClosureSignal[] {
  const found = new Map<string, ClosureSignal>();
  for (const s of detectClosureLanguage(extractProminentText(html), 'prominent')) keepStrongest(found, s);
  for (const s of detectClosureLanguage(text, 'body')) keepStrongest(found, s);
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

// The scraped `deadline` field is free text and frequently holds a START date —
// "Launched January 15, 2025", "March 6, 2025 (applications open)". Read as an
// end date those look long expired, and a real backfill run auto-downgraded
// three live programs on exactly this before anyone caught it. A start date is
// not a deadline: refuse to parse rather than guess the wrong direction.
const START_DATE =
  /\b(?:launch(?:ed|es|ing)?|open(?:ed|s|ing)?|effective|as\s+of|beginning|begins|starts?|started|starting|available\s+from|since|intake\s+opens?|accepting\s+(?:applications\s+)?from)\b/i;

// Words that mean the date really is an END date. When one of these is present
// the start-date veto above does not apply — "opened March 2024, closes December
// 31, 2027" is a genuine deadline, and we should still read it.
const DEADLINE_WORD =
  /\b(?:deadline|clos(?:e|es|ed|ing)|due|expir(?:e|es|ed|y|ation)|end(?:s|ed|ing)?|last\s+day|no\s+later\s+than|until|by\s+\w+\s+\d)\b/i;

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
  // A start date with no closing language is not a deadline at all.
  if (START_DATE.test(text) && !DEADLINE_WORD.test(text)) return null;

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

  signals.push(...detectPageClosureLanguage(obs.text, obs.html));

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
