/**
 * The commercial inquiry form (/commercial): validation, file rules, and what
 * the lead and the admin alert say.
 *
 * Pure, so every rule is pinned by lib/commercial-inquiry.test.ts. The API
 * wiring is the `commercial_presign` and `commercial_inquiry` flows in
 * api/leads/index.ts.
 *
 * Two paths through one form:
 *   A. 'tender'  — a general contractor pricing a job. Bid closing date required.
 *   B. 'project' — a business, property manager or designer asking for a quote.
 *                  Target completion or opening date, optional: an owner still
 *                  budgeting may not have one, and should still reach us.
 *
 * /commercial/owners (the Meta ad for business owners) uses the 'project' path
 * with a shorter form: `audience: 'owner'` makes company optional and sets the
 * role, because neither is worth a field to someone on a phone.
 *
 * Who hears about it: the ADMIN only. The lead is unassigned, the alert goes to
 * the team inbox, and the sender is not texted. Commercial work has no booking
 * flow, and none of the homeowner messages are true for it.
 */

export type CommercialPath = 'tender' | 'project';

export const COMMERCIAL_PROJECT_TYPES = [
  'Custom millwork',
  'Restaurant or hospitality',
  'Retail',
  'Office',
  'School, library or institution',
  'Other',
] as const;
/** The owner form's plain labels for the same stored project types. */
export const COMMERCIAL_OWNER_BUSINESS_TYPES = [
  { value: 'Restaurant or hospitality', label: 'Restaurant or café' },
  { value: 'Retail', label: 'Shop or salon' },
  { value: 'Office', label: 'Office' },
  { value: 'Other', label: 'Something else' },
] as const;
export const COMMERCIAL_ROLES = ['Business owner', 'Property manager', 'Designer or architect', 'Other'] as const;

/**
 * Larger and wider than the /windows rules: a drawing set is not a phone photo.
 * ZIP has two content types because Windows browsers report the second one.
 * Browsers report no reliable type for CAD files, so `commercialFileType`
 * settles those from the extension.
 */
export const COMMERCIAL_FILE_RULES = {
  maxFiles: 10,
  maxBytes: 100 * 1024 * 1024,
  types: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/zip',
    'application/x-zip-compressed',
    'application/acad',
    'application/dxf',
    'application/x-archicad-pln',
  ] as readonly string[],
};

const TYPE_BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  zip: 'application/zip',
  dwg: 'application/acad',
  dxf: 'application/dxf',
  pln: 'application/x-archicad-pln',
};

/** The type to file an upload under: its extension first, the browser's guess second. */
export function commercialFileType(name: string, browserType: string): string {
  const extension = String(name ?? '').toLowerCase().split('.').pop() ?? '';
  return TYPE_BY_EXTENSION[extension] ?? browserType;
}

/** Everything under this prefix in R2 is a commercial drawing set. Private. */
export const COMMERCIAL_FILE_PREFIX = 'commercial-drawings/';

/** Exactly the wording beside the checkbox, stored on the lead with the time. */
export const COMMERCIAL_CONSENT_TEXT =
  'I agree that OntarioReno may contact me by phone, text and email about this project. I can opt out at any time.';

export type CommercialFile = { key: string; name: string; size: number; type: string };

export type CommercialInquiry = {
  path: CommercialPath;
  /** 'owner' when it came through the short form on /commercial/owners. */
  audience: '' | 'owner';
  company: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  projectType: string;
  role: string;
  /** Bid closing date on a tender, target completion or opening date on a project. */
  keyDate: string;
  scope: string;
  drawingsLink: string;
  files: CommercialFile[];
  utmSource: string;
  utmCampaign: string;
  ref: string;
};

const s = (v: unknown, max = 200) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

export function isAllowedCommercialFile(type: string, size: number): boolean {
  return COMMERCIAL_FILE_RULES.types.includes(type) && size > 0 && size <= COMMERCIAL_FILE_RULES.maxBytes;
}

function safeFileName(name: string): string {
  const cleaned = String(name ?? '').replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_+/g, '_');
  return (cleaned || 'drawing').slice(-60);
}

/** The one shape of key the presign flow hands out. */
export function commercialFileKey(uploadId: string, fileName: string): string {
  return `${COMMERCIAL_FILE_PREFIX}${uploadId}/${safeFileName(fileName)}`;
}

const KEY_PATTERN =
  /^commercial-drawings\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[a-zA-Z0-9._-]{1,60}$/;

/**
 * True only for a key the presign flow could have issued, so a submission
 * cannot attach some other object in the bucket to a lead.
 */
export function isCommercialFileKey(key: string): boolean {
  return KEY_PATTERN.test(key) && !key.includes('..');
}

/**
 * Who may open a file stored on a lead. Admins may open any. A rep may open a
 * COMMERCIAL file on a lead assigned to them, and nothing else: window quotes
 * and /match documents stay admin-only, and contractor accounts get none.
 * Reassigning the lead ends the access.
 */
export function canOpenLeadFile(
  user: { id: string; role: string },
  lead: { assignedRepId?: string | null },
  fileKey: string,
): boolean {
  if (user.role === 'admin') return true;
  return (
    user.role === 'rep' &&
    Boolean(lead.assignedRepId) &&
    lead.assignedRepId === user.id &&
    fileKey.startsWith(COMMERCIAL_FILE_PREFIX)
  );
}

/**
 * The files to list on a lead, keeping each one's position in Lead.quoteFiles,
 * because that position is what the file link addresses.
 */
export function leadFilesFor(files: unknown, isAdmin: boolean): { index: number; name: string }[] {
  if (!Array.isArray(files)) return [];
  return files.flatMap((file, index) => {
    const key = String((file as { key?: unknown } | null)?.key ?? '');
    if (!key || (!isAdmin && !key.startsWith(COMMERCIAL_FILE_PREFIX))) return [];
    return [{ index, name: String((file as { name?: unknown }).name ?? '') || `File ${index + 1}` }];
  });
}

/** A real calendar date as YYYY-MM-DD. Rejects 2026-02-31. */
export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** Empty when it is not an http(s) link. The link is only ever shown as text. */
export function normalizeDrawingsLink(raw: unknown): string {
  const value = s(raw, 500);
  if (!value) return '';
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
  } catch {
    return '';
  }
}

export type CommercialParseResult = { ok: true; value: CommercialInquiry } | { ok: false; error: string };

export function parseCommercialInquiry(body: Record<string, unknown>): CommercialParseResult {
  const path = body.path === 'tender' || body.path === 'project' ? body.path : null;
  if (!path) return { ok: false, error: 'Choose how we can help.' };

  const audience = path === 'project' && body.audience === 'owner' ? 'owner' : '';
  const company = s(body.company, 160);
  const name = s(body.name, 120);
  const phone = s(body.phone, 40);
  const email = s(body.email, 160).toLowerCase();
  const city = s(body.city, 80);
  const projectType = s(body.projectType, 60);
  if (!company && !audience) return { ok: false, error: 'Please enter your company name.' };
  if (!name) return { ok: false, error: 'Please enter your name.' };
  if (phone.replace(/\D/g, '').length < 10) return { ok: false, error: 'Please enter a 10-digit phone number.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'Please enter a valid email.' };
  if (!city) return { ok: false, error: 'Please enter the project city.' };
  if (!(COMMERCIAL_PROJECT_TYPES as readonly string[]).includes(projectType)) {
    return { ok: false, error: 'Please choose a project type.' };
  }

  const keyDate = s(body.keyDate, 10);
  let role = 'General contractor';
  if (path === 'tender') {
    if (!isIsoDate(keyDate)) return { ok: false, error: 'Please enter the bid closing date.' };
  } else {
    role = audience ? 'Business owner' : s(body.role, 40);
    if (!(COMMERCIAL_ROLES as readonly string[]).includes(role)) return { ok: false, error: 'Please choose your role.' };
    if (keyDate && !isIsoDate(keyDate)) return { ok: false, error: 'Please enter a valid target date.' };
  }

  const rawLink = s(body.drawingsLink, 500);
  const drawingsLink = normalizeDrawingsLink(rawLink);
  if (rawLink && !drawingsLink) return { ok: false, error: 'Please enter a full link, starting with https://' };

  const raw = Array.isArray(body.files) ? body.files : [];
  const files = raw.slice(0, COMMERCIAL_FILE_RULES.maxFiles).map((f) => {
    const o = (f && typeof f === 'object' ? f : {}) as Record<string, unknown>;
    return { key: s(o.key, 200), name: s(o.name, 120), size: Number(o.size) || 0, type: s(o.type, 60) };
  });
  if (files.some((f) => !isCommercialFileKey(f.key) || !isAllowedCommercialFile(f.type, f.size))) {
    return { ok: false, error: 'One of the files could not be accepted. Please upload it again.' };
  }

  if (body.consent !== true) return { ok: false, error: 'Please tick the box so we can contact you.' };

  const tracking = (body.tracking && typeof body.tracking === 'object' ? body.tracking : {}) as Record<string, unknown>;
  return {
    ok: true,
    value: {
      path, audience, company, name, phone, email, city, projectType, role, keyDate,
      scope: s(body.scope, 2000),
      drawingsLink,
      files,
      utmSource: s(tracking.utmSource, 80),
      utmCampaign: s(tracking.utmCampaign, 120),
      ref: s(tracking.ref, 80),
    },
  };
}

const PATH_LABEL: Record<CommercialPath, string> = {
  tender: 'Tender',
  project: 'Quote request',
};

/** Lead.sourceDetail: page, path and company, so the portal list reads at a glance. */
export function commercialSourceDetail(q: CommercialInquiry): string {
  const tags = [
    q.utmSource && `utm_source=${q.utmSource}`,
    q.utmCampaign && `utm_campaign=${q.utmCampaign}`,
    q.ref && `ref=${q.ref}`,
  ].filter(Boolean);
  const page = q.audience ? '/commercial/owners' : '/commercial';
  return [`Commercial (${page}) · ${PATH_LABEL[q.path]} · ${q.company || q.name}`, ...tags].join(' · ').slice(0, 300);
}

function detailLines(q: CommercialInquiry): string[] {
  const lines = [
    `Company: ${q.company || 'Not asked'}`,
    `Role: ${q.role}`,
    `Project type: ${q.projectType}`,
    `City: ${q.city}`,
  ];
  if (q.path === 'tender') lines.push(`Bid closing: ${q.keyDate}`);
  else lines.push(`Target completion / opening: ${q.keyDate || 'Not set'}`);
  if (q.scope) lines.push(`Scope: ${q.scope}`);
  if (q.drawingsLink) lines.push(`Drawings link: ${q.drawingsLink}`);
  return lines;
}

export function commercialNotes(q: CommercialInquiry, consentAt: string): string {
  const lines = ['Commercial inquiry form', `Path: ${PATH_LABEL[q.path]}`, ...detailLines(q)];
  if (q.files.length > 0) lines.push(`Files: ${q.files.map((f) => f.name || 'file').join(', ')}`);
  if (q.ref) lines.push(`Referral ref: ${q.ref}`);
  lines.push(`Consent (${consentAt}): "${COMMERCIAL_CONSENT_TEXT}"`);
  return lines.join('\n');
}

/**
 * The admin's email. `fileLink(i)` builds the link for the i-th file; those
 * links need a portal admin login, so the email never carries a usable copy of
 * the drawings by itself.
 */
export function commercialAlert(
  q: CommercialInquiry,
  leadId: string,
  fileLink: (index: number) => string,
): { subject: string; body: string } {
  const subject =
    q.path === 'tender'
      ? `Commercial tender: ${q.company}, bid closes ${q.keyDate} (${q.city})`
      : `Commercial quote request: ${q.company || q.name} (${q.city})`;
  const lines = [
    q.path === 'tender'
      ? 'A general contractor sent a project to price.'
      : q.audience
        ? 'A business owner came through the owner ad page.'
        : 'A business asked for a commercial quote.',
    '',
    `Name: ${q.name}`,
    `Phone: ${q.phone}`,
    `Email: ${q.email}`,
    ...detailLines(q),
  ];
  if (q.files.length > 0) {
    lines.push('', `Files (${q.files.length}). Opening one needs a portal admin login:`);
    q.files.forEach((f, i) => lines.push(`  ${f.name || `File ${i + 1}`}: ${fileLink(i)}`));
  }
  const tags = [
    q.utmSource && `utm_source ${q.utmSource}`,
    q.utmCampaign && `utm_campaign ${q.utmCampaign}`,
    q.ref && `ref ${q.ref}`,
  ].filter(Boolean);
  lines.push('', `Source: ${tags.length ? tags.join(', ') : 'No tags on the link'}`);
  lines.push(`Lead ID: ${leadId}`, '', 'Promised reply: within one business day. This lead is unassigned and waiting in admin triage.');
  return { subject, body: lines.join('\n') };
}
