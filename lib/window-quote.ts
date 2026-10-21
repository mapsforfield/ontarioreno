/**
 * The windows & doors quote form (/windows): validation, file rules, and what
 * the lead and the admin alert say.
 *
 * Pure, so every rule is pinned by lib/window-quote.test.ts. The API wiring is
 * the `windows_presign` and `windows_quote` flows and the `?quote_file=`
 * route in api/leads/index.ts.
 *
 * Two paths through one form:
 *   A. 'upload'  — the homeowner already has a quote from someone else and
 *                  sends us the file(s) to beat.
 *   B. 'request' — no quote yet; a few sizing questions instead.
 *
 * Who hears about it: the ADMIN only. The lead is created unassigned (admin
 * triage), the alert goes to the team inbox, and the homeowner is not texted.
 * That last one is a decision, not an omission: there is no windows booking
 * flow for a text to point at, and real prospects receive whatever we send.
 */

export type WindowQuotePath = 'upload' | 'request';

export const WINDOW_COUNT_OPTIONS = ['1-5', '6-10', '11-20', '20+'] as const;
export const DOOR_COUNT_OPTIONS = ['0', '1', '2', '3+'] as const;
export const TIMELINE_OPTIONS = ['ASAP', '1-3 months', '3+ months', 'Just researching'] as const;

/** Uploaded quote files. Kept tight: a quote is a PDF or a phone photo of one. */
export const QUOTE_FILE_RULES = {
  maxFiles: 5,
  maxBytes: 10 * 1024 * 1024,
  types: ['application/pdf', 'image/jpeg', 'image/png'] as readonly string[],
};

/** Everything under this prefix in R2 is a homeowner's quote. Private. */
export const QUOTE_FILE_PREFIX = 'window-quotes/';

/**
 * Exactly the wording beside the checkbox. Stored on the lead with the time it
 * was ticked, so "did they agree to be texted" has an answer later.
 */
export const WINDOW_CONSENT_TEXT =
  'I agree that OntarioReno may contact me by phone, text and email about my windows and doors project. I can opt out at any time.';

export type QuoteFile = { key: string; name: string; size: number; type: string };

export type WindowQuote = {
  path: WindowQuotePath;
  name: string;
  phone: string;
  email: string;
  postalCode: string;
  windows: string;
  doors: string;
  timeline: string;
  files: QuoteFile[];
  utmSource: string;
  utmCampaign: string;
  ref: string;
};

const s = (v: unknown, max = 200) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

/** "m5v2t6" → "M5V 2T6". Empty when it is not a Canadian postal code. */
export function normalizePostalCode(raw: unknown): string {
  const compact = String(raw ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!/^[ABCEGHJ-NPRSTVXY]\d[A-Z]\d[A-Z]\d$/.test(compact)) return '';
  return `${compact.slice(0, 3)} ${compact.slice(3)}`;
}

export function isAllowedQuoteFile(type: string, size: number): boolean {
  return QUOTE_FILE_RULES.types.includes(type) && size > 0 && size <= QUOTE_FILE_RULES.maxBytes;
}

/** Original filename made safe for an object key, extension kept. */
export function safeFileName(name: string): string {
  const cleaned = String(name ?? '').replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_+/g, '_');
  return (cleaned || 'quote').slice(-60);
}

/** The one shape of key the presign flow hands out. */
export function quoteFileKey(uploadId: string, fileName: string): string {
  return `${QUOTE_FILE_PREFIX}${uploadId}/${safeFileName(fileName)}`;
}

const KEY_PATTERN = /^window-quotes\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[a-zA-Z0-9._-]{1,60}$/;

/**
 * True only for a key the presign flow could have issued. The submit flow
 * trusts nothing else, so a submission cannot attach some other object in the
 * bucket (a finance document, a client video) to a lead.
 */
export function isQuoteFileKey(key: string): boolean {
  return KEY_PATTERN.test(key) && !key.includes('..');
}

export type ParseResult = { ok: true; value: WindowQuote } | { ok: false; error: string };

export function parseWindowQuote(body: Record<string, unknown>): ParseResult {
  const path = body.path === 'upload' || body.path === 'request' ? body.path : null;
  if (!path) return { ok: false, error: 'Choose whether you have a quote.' };

  const name = s(body.name, 120);
  const phone = s(body.phone, 40);
  const email = s(body.email, 160).toLowerCase();
  const postalCode = normalizePostalCode(body.postalCode);
  if (!name) return { ok: false, error: 'Please enter your name.' };
  if (phone.replace(/\D/g, '').length < 10) return { ok: false, error: 'Please enter a 10-digit phone number.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'Please enter a valid email.' };
  if (!postalCode) return { ok: false, error: 'Please enter a valid postal code, like L1S 2T6.' };
  if (body.consent !== true) return { ok: false, error: 'Please tick the box so we can contact you.' };

  let files: QuoteFile[] = [];
  let windows = '';
  let doors = '';
  let timeline = '';

  if (path === 'upload') {
    const raw = Array.isArray(body.files) ? body.files : [];
    files = raw.slice(0, QUOTE_FILE_RULES.maxFiles).map((f) => {
      const o = (f && typeof f === 'object' ? f : {}) as Record<string, unknown>;
      return { key: s(o.key, 200), name: s(o.name, 120), size: Number(o.size) || 0, type: s(o.type, 60) };
    });
    if (files.length === 0) return { ok: false, error: 'Please add your quote (PDF, JPG or PNG).' };
    if (files.some((f) => !isQuoteFileKey(f.key) || !isAllowedQuoteFile(f.type, f.size))) {
      return { ok: false, error: 'One of the files could not be accepted. Please upload it again.' };
    }
  } else {
    windows = s(body.windows, 20);
    doors = s(body.doors, 20);
    timeline = s(body.timeline, 40);
    if (!(WINDOW_COUNT_OPTIONS as readonly string[]).includes(windows)) return { ok: false, error: 'How many windows?' };
    if (!(DOOR_COUNT_OPTIONS as readonly string[]).includes(doors)) return { ok: false, error: 'How many doors?' };
    if (!(TIMELINE_OPTIONS as readonly string[]).includes(timeline)) return { ok: false, error: 'When are you hoping to install?' };
  }

  const tracking = (body.tracking && typeof body.tracking === 'object' ? body.tracking : {}) as Record<string, unknown>;
  return {
    ok: true,
    value: {
      path, name, phone, email, postalCode, windows, doors, timeline, files,
      utmSource: s(tracking.utmSource, 80),
      utmCampaign: s(tracking.utmCampaign, 120),
      ref: s(tracking.ref, 80),
    },
  };
}

const PATH_LABEL: Record<WindowQuotePath, string> = {
  upload: 'Has a quote (uploaded)',
  request: 'Needs a quote',
};

/**
 * Lead.sourceDetail. Leads with the page and path so the portal list says what
 * this is at a glance; the tags follow so a referral partner's `ref` is
 * searchable.
 */
export function windowQuoteSourceDetail(q: WindowQuote): string {
  const tags = [
    q.utmSource && `utm_source=${q.utmSource}`,
    q.utmCampaign && `utm_campaign=${q.utmCampaign}`,
    q.ref && `ref=${q.ref}`,
  ].filter(Boolean);
  return [`Windows (/windows) · ${PATH_LABEL[q.path]}`, ...tags].join(' · ').slice(0, 300);
}

export function windowQuoteNotes(q: WindowQuote, consentAt: string): string {
  const lines = ['Windows & doors quote form'];
  lines.push(`Path: ${PATH_LABEL[q.path]}`);
  if (q.path === 'upload') {
    lines.push(`Quote files: ${q.files.map((f) => f.name || 'file').join(', ')}`);
  } else {
    lines.push(`Windows: ${q.windows}`, `Doors: ${q.doors}`, `Timeline: ${q.timeline}`);
  }
  lines.push(`Postal code: ${q.postalCode}`);
  if (q.ref) lines.push(`Referral ref: ${q.ref}`);
  lines.push(`Consent (${consentAt}): "${WINDOW_CONSENT_TEXT}"`);
  return lines.join('\n');
}

/**
 * The admin's email. `fileLink(i)` builds the link for the i-th file; those
 * links need a portal admin login, so the email never carries a usable copy of
 * the homeowner's document by itself.
 */
export function windowQuoteAlert(
  q: WindowQuote,
  leadId: string,
  fileLink: (index: number) => string,
): { subject: string; body: string } {
  const subject =
    q.path === 'upload'
      ? `Window quote to beat: ${q.name} (${q.postalCode})`
      : `Window quote request: ${q.name}, ${q.windows} windows (${q.postalCode})`;
  const lines = [
    q.path === 'upload'
      ? 'A homeowner sent a window quote for us to beat.'
      : 'A homeowner asked for a window & door quote.',
    '',
    `Name:          ${q.name}`,
    `Phone:         ${q.phone}`,
    `Email:         ${q.email}`,
    `Postal code:   ${q.postalCode}`,
  ];
  if (q.path === 'upload') {
    lines.push('', `Quote files (${q.files.length}). Opening one needs a portal admin login:`);
    q.files.forEach((f, i) => lines.push(`  ${f.name || `File ${i + 1}`}: ${fileLink(i)}`));
  } else {
    lines.push('', `Windows:       ${q.windows}`, `Doors:         ${q.doors}`, `Timeline:      ${q.timeline}`);
  }
  const tags = [
    q.utmSource && `utm_source ${q.utmSource}`,
    q.utmCampaign && `utm_campaign ${q.utmCampaign}`,
    q.ref && `ref ${q.ref}`,
  ].filter(Boolean);
  lines.push('', `Source:        ${tags.length ? tags.join(', ') : 'No tags on the link'}`);
  lines.push(`Lead ID:       ${leadId}`, '', 'Promised reply: within 24 hours. This lead is unassigned and waiting in admin triage.');
  return { subject, body: lines.join('\n') };
}
