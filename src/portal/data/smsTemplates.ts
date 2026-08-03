/**
 * Outbound SMS templates for the call queue.
 *
 * The portal doesn't send texts itself — it hands the finished message to Quo
 * (the default sms: handler) exactly the way "Call now" hands it a tel: link.
 * The rep still presses Send in Quo, so nothing leaves the building by accident.
 *
 * To add a template, append to SMS_TEMPLATES. Keep them short: anything over
 * ~320 characters gets split into multiple billed segments by the carrier.
 */

export type SmsTemplate = {
  id: string;
  /** Shown in the template picker. */
  label: string;
  /** Builds the message body for one lead. */
  build: (vars: SmsTemplateVars) => string;
};

export type SmsTemplateVars = {
  /** First name, already cleaned up — falls back to "there". */
  firstName: string;
};

/** "Emmanuel Boa Amponsem" → "Emmanuel"; blank/junk → "there". */
export function leadFirstName(name: string | null | undefined): string {
  const first = String(name ?? '').trim().split(/\s+/)[0] ?? '';
  // Skip all-caps surnames-first entries and stray punctuation-only tokens.
  const cleaned = first.replace(/[^\p{L}\p{N}'’-]/gu, '');
  if (!cleaned) return 'there';
  return cleaned.length > 1 && cleaned === cleaned.toUpperCase()
    ? cleaned.charAt(0) + cleaned.slice(1).toLowerCase()
    : cleaned;
}

export const SMS_TEMPLATES: SmsTemplate[] = [
  {
    id: 'hamilton_grant_guidelines',
    label: 'Hamilton grant — updated guidelines',
    build: ({ firstName }) =>
      `Hi ${firstName}, since you previously inquired about the $40K Hamilton Housing Grant, ` +
      'you can now review updated guidelines and book your direct consultation here: ' +
      'https://ontarioreno.ca/consultation/hamilton',
  },
];

export const DEFAULT_SMS_TEMPLATE_ID = SMS_TEMPLATES[0].id;

export function smsTemplateById(id: string): SmsTemplate {
  return SMS_TEMPLATES.find((t) => t.id === id) ?? SMS_TEMPLATES[0];
}

/**
 * sms: link with a prefilled body.
 *
 * The `?&body=` form (question mark, then ampersand) is the quirk that makes a
 * single-recipient body survive both Windows/Quo and iOS — plain `?body=` is
 * dropped by some handlers. Returns null when there's no dialable number.
 */
export function smsHref(phone: string | null | undefined, body: string): string | null {
  const safe = String(phone ?? '').replace(/[^+\d]/g, '');
  if (!safe) return null;
  return `sms:${safe}?&body=${encodeURIComponent(body)}`;
}
