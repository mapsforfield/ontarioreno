/**
 * Outbound text templates for the call queue.
 *
 * The portal doesn't send texts itself — it hands the finished message to Quo
 * (OpenPhone) the way "Call now" hands it a tel: link, and the rep presses Send.
 *
 * Quo does NOT register the `sms:` scheme on Windows, so an sms: link silently
 * does nothing. It registers `tel:`, `quo:` and `openphone:`, and its documented
 * deep link for a prefilled message is:
 *   openphone://message?number=<e164>&text=<url-encoded body>
 * (https://support.quo.com/core-concepts/integrations/deep-linking)
 *
 * Templates are editable in the portal and persist per browser in localStorage.
 */

export type SmsTemplate = {
  id: string;
  /** Shown in the picker. */
  label: string;
  /** Body text, may contain {first_name} / {name} placeholders. */
  body: string;
};

const STORAGE_KEY = 'portal.callflow.smsTemplates.v1';

/** Ships with the portal; editable, and restored if the rep deletes everything. */
export const BUILT_IN_TEMPLATES: SmsTemplate[] = [
  {
    id: 'hamilton_grant_guidelines',
    label: 'Hamilton grant — updated guidelines',
    body:
      'Hi {first_name}, since you previously inquired about the $40K Hamilton Housing Grant, ' +
      'you can now review updated guidelines and book your direct consultation here: ' +
      'https://ontarioreno.ca/consultation/hamilton',
  },
];

/** Placeholders a rep can type into a template body. */
export const TEMPLATE_PLACEHOLDERS = ['{first_name}', '{name}'] as const;

/** "Emmanuel Boa Amponsem" → "Emmanuel"; blank/junk → "there". */
export function leadFirstName(name: string | null | undefined): string {
  const first = String(name ?? '').trim().split(/\s+/)[0] ?? '';
  const cleaned = first.replace(/[^\p{L}\p{N}'’-]/gu, '');
  if (!cleaned) return 'there';
  // Imported lists are full of SHOUTED surnames; don't shout them back.
  return cleaned.length > 1 && cleaned === cleaned.toUpperCase()
    ? cleaned.charAt(0) + cleaned.slice(1).toLowerCase()
    : cleaned;
}

export function renderTemplate(body: string, leadName: string | null | undefined): string {
  return body
    .replace(/\{first_name\}/g, leadFirstName(leadName))
    .replace(/\{name\}/g, String(leadName ?? '').trim() || 'there');
}

// ─── Persistence ──────────────────────────────────────────────────────────────

function isTemplate(v: unknown): v is SmsTemplate {
  const t = v as SmsTemplate;
  return !!t && typeof t.id === 'string' && typeof t.label === 'string' && typeof t.body === 'string';
}

export function loadTemplates(): SmsTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return BUILT_IN_TEMPLATES;
    const parsed: unknown = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed.filter(isTemplate) : [];
    return list.length ? list : BUILT_IN_TEMPLATES;
  } catch {
    return BUILT_IN_TEMPLATES;
  }
}

export function saveTemplates(list: SmsTemplate[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* private browsing — edits still apply for this session */
  }
}

export function newTemplateId(): string {
  return `tpl_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

// ─── Quo deep link ────────────────────────────────────────────────────────────

/** Digits only, with the North American +1 added when it's a bare 10-digit number. */
export function toE164(phone: string | null | undefined): string {
  const digits = String(phone ?? '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return String(phone ?? '').trim().startsWith('+') ? `+${digits}` : digits;
}

/**
 * Deep link that opens Quo on the conversation with the message prefilled.
 * Returns null when there's no dialable number.
 */
export function quoMessageHref(phone: string | null | undefined, text: string): string | null {
  const number = toE164(phone);
  if (!number) return null;
  // `quo://` rather than `openphone://`: the desktop app's main process only
  // forwards tel: and quo:// URLs into the app window. openphone:// launches the
  // app but the URL is dropped, which is why it focused Quo and did nothing.
  return `quo://message?number=${encodeURIComponent(number)}&text=${encodeURIComponent(text)}`;
}
