/**
 * HTML email template builders for OntarioReno transactional emails.
 *
 * Design goals:
 *  - Single-column, mobile-first layout (600 px max-width outer container)
 *  - Table-based structure + inline styles for Outlook/webmail compatibility
 *  - bgcolor attributes on every coloured <td> for Outlook fallback
 *  - MSO VML buttons so Outlook renders rounded CTAs
 *  - Plain-text counterparts are generated separately in consultationEmails.ts
 *
 * Security: this module only builds strings — no fetch, no env vars, no
 * API keys. It runs in the browser inside the portal React app.
 */

import type { Appointment, Contractor, ContractorDispatch, Deal, User } from './types';
import { getCustomerFacingConsultantPhone } from './customerContactRouting';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Custom-event appointment types. These are internal calendar entries (showroom
 * visits, supplier meetings, site checks, ad-hoc events) rather than renovation
 * consultations, so any customer-facing copy must avoid the word "consultation".
 */
export const EVENT_APPOINTMENT_TYPES = [
  'showroom_visit',
  'supplier_meeting',
  'site_check',
  'custom_event',
];

export function isEventAppointment(type: string | null | undefined): boolean {
  return type != null && EVENT_APPOINTMENT_TYPES.includes(type);
}

/** Customer-facing label for each appointment type. */
export const APPOINTMENT_TYPE_LABELS: Record<string, string> = {
  home_visit: 'Home Visit',
  phone_consultation: 'Phone Consultation',
  video_consultation: 'Video Consultation',
  showroom_visit: 'Showroom Visit',
  supplier_meeting: 'Supplier Meeting',
  site_check: 'Site Check',
  custom_event: 'Appointment',
};

/** HTML-escape any user-supplied content before insertion. */
function e(val: string | null | undefined): string {
  if (val == null) return '';
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Format a YYYY-MM-DD date string for display.
 * We use T12:00:00 to avoid UTC midnight rollover issues in North American TZs.
 */
function fmtDate(d: string | null | undefined): string {
  if (!d) return 'Date TBD';
  try {
    return new Date(`${d}T12:00:00`).toLocaleDateString('en-CA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return d;
  }
}

/** Format HH:MM (24-hour) → 12-hour time with AM/PM. */
function fmtTime(t: string | null | undefined): string {
  if (!t) return 'Time TBD';
  try {
    const [hStr, mStr] = t.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${period}`;
  } catch {
    return t;
  }
}

/** Short reference number derived from appointment ID for customer display. */
function refId(id: string): string {
  return `#${id.replace(/-/g, '').slice(-8).toUpperCase()}`;
}

/**
 * Signed customer action URLs, minted server-side by /api/auth/customer-links.
 *
 * These templates deliberately cannot build these URLs themselves: the signing
 * secret must never reach the browser, and an unsigned link would be a link that
 * authorizes a booking change on the appointment id alone. When links are not
 * supplied the action buttons are omitted entirely rather than degraded.
 */
export type CustomerActionLinks = {
  rescheduleUrl: string;
  cancelUrl: string;
};

// ─── Status configuration ─────────────────────────────────────────────────────

/**
 * Customer-facing email types that drive the header colour scheme and copy.
 * Rep and contractor dispatch emails use their own separate builders.
 */
export type CustomerEmailType =
  | 'booking_confirmation'
  | 'cancellation_notice'
  | 'reschedule_notice';

type StatusCfg = {
  /** Badge label shown below the header. */
  label: string;
  /** Badge pill background colour. */
  badgeBg: string;
  /** Badge pill text colour. */
  badgeColor: string;
  /** Accent strip colour used on detail card rows. */
  accent: string;
  /** Opening paragraph copy after the greeting. */
  intro: string;
  /** Whether to render Reschedule / Cancel action buttons. */
  showActions: boolean;
};

const STATUS: Record<CustomerEmailType, StatusCfg> = {
  booking_confirmation: {
    label: 'Appointment Confirmed',
    badgeBg: '#dcfce7',
    badgeColor: '#166534',
    accent: '#16a34a',
    intro:
      'Your renovation consultation has been successfully booked. We look forward to seeing you.',
    showActions: true,
  },
  reschedule_notice: {
    label: 'Appointment Rescheduled',
    badgeBg: '#fef3c7',
    badgeColor: '#92400e',
    accent: '#d97706',
    intro:
      'Your renovation consultation has been rescheduled to the date and time shown below.',
    showActions: true,
  },
  cancellation_notice: {
    label: 'Appointment Cancelled',
    badgeBg: '#fee2e2',
    badgeColor: '#991b1b',
    accent: '#dc2626',
    intro:
      'Your renovation consultation has been cancelled. Please contact us if you have any questions or would like to rebook.',
    showActions: false,
  },
};

// ─── Shared primitives ────────────────────────────────────────────────────────

/**
 * One labelled row inside the appointment details card.
 * A 4 px coloured strip on the left provides visual hierarchy without borders.
 */
function detailRow(
  label: string,
  value: string,
  accent: string,
  last = false,
): string {
  const borderStyle = last ? '' : 'border-bottom:1px solid #f1f5f9;';
  return `<tr>
  <td width="4" bgcolor="${accent}" style="width:4px;background-color:${accent};font-size:1px;line-height:1px;">&nbsp;</td>
  <td style="padding:13px 18px;${borderStyle}font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
    <p style="margin:0 0 3px 0;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#94a3b8;">${label}</p>
    <p style="margin:0;font-size:15px;font-weight:600;color:#0f172a;">${value}</p>
  </td>
</tr>`;
}

/** Table wrapper that groups detail rows with a border and rounded corners. */
function detailCard(rows: string[]): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
  <tbody>
    ${rows.join('\n    ')}
  </tbody>
</table>`;
}

/**
 * Full-width CTA button with MSO VML fallback so Outlook renders a
 * proper rounded rectangle instead of a plain hyperlink.
 */
function ctaButton(label: string, url: string, bg: string, color: string): string {
  const safeUrl = e(url);
  const safeLabel = e(label);
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;">
  <tbody><tr>
    <td align="center">
      <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${safeUrl}" style="height:48px;v-text-anchor:middle;width:340px;" arcsize="8%" fillcolor="${bg}" strokecolor="${bg}"><w:anchorlock/><center style="color:${color};font-family:sans-serif;font-size:15px;font-weight:700;">${safeLabel}</center></v:roundrect><![endif]-->
      <!--[if !mso]><!-->
      <a href="${safeUrl}" target="_blank"
        style="display:block;max-width:340px;width:100%;padding:14px 32px;background-color:${bg};color:${color};font-size:15px;font-weight:700;text-decoration:none;border-radius:8px;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;box-sizing:border-box;"
      >${safeLabel}</a>
      <!--<![endif]-->
    </td>
  </tr></tbody>
</table>`;
}

/**
 * Highlighted note block — used for customer notes, internal notes, privacy
 * notices, etc.
 */
function noteBlock(
  title: string,
  text: string,
  bg: string,
  borderColor: string,
  titleColor: string,
  textColor: string,
): string {
  return `<div style="margin-top:18px;padding:15px 18px;background-color:${bg};border-left:3px solid ${borderColor};border-radius:0 8px 8px 0;">
  <p style="margin:0 0 4px 0;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${titleColor};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">${e(title)}</p>
  <p style="margin:0;font-size:14px;color:${textColor};line-height:1.65;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">${e(text)}</p>
</div>`;
}

/**
 * Dark-blue contractor header block.
 *
 * Logo display rules:
 *  - Only publicly hosted http/https URLs are used in <img> — data: URIs are
 *    blocked by every major email client (Gmail, Outlook, Apple Mail).
 *  - When a valid URL is present the logo is shown inside a white rounded card
 *    (16 px radius, generous padding) so it pops cleanly against the dark blue
 *    regardless of whether the image has a transparent or white background.
 *    Max rendered height is 96 px, max-width 220 px.
 *  - When no hosted URL is available, the company name appears as a
 *    frosted-glass pill (white/12% opacity background) in reversed-out text.
 */
function contractorHeader(contractor: Contractor | undefined, contractorName: string): string {
  const rawLogoUrl = contractor?.logoUrl?.trim();
  // Only use the logo if it's a hosted URL — data: URLs don't render in email.
  const logoUrl =
    rawLogoUrl && (rawLogoUrl.startsWith('http://') || rawLogoUrl.startsWith('https://'))
      ? rawLogoUrl
      : undefined;

  const brand = logoUrl
    ? `<!--[if mso]><table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td style="background:#ffffff;border-radius:16px;padding:16px 24px;"><![endif]-->
       <div style="display:inline-block;background:#ffffff;border-radius:16px;padding:16px 24px;margin-bottom:16px;line-height:0;">
         <img src="${e(logoUrl)}" alt="${e(contractorName)}" height="96"
           style="display:block;max-width:220px;max-height:96px;width:auto;object-fit:contain;border:0;outline:none;" />
       </div>
       <!--[if mso]></td></tr></table><![endif]-->`
    : `<div style="display:inline-block;background:rgba(255,255,255,0.12);border-radius:10px;padding:10px 22px;margin-bottom:16px;">
        <span style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.01em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">${e(contractorName)}</span>
       </div>`;

  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#1B3C6C">
<tbody><tr>
  <td align="center" style="padding:36px 24px 28px 24px;background-color:#1B3C6C;">
    ${brand}
    <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.10em;text-transform:uppercase;color:rgba(255,255,255,0.55);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">Renovation Consultation</p>
  </td>
</tr></tbody>
</table>`;
}

/** Coloured badge pill indicating the appointment status. */
function statusBadge(cfg: StatusCfg): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff">
<tbody><tr>
  <td align="center" style="padding:22px 24px 0 24px;background-color:#ffffff;">
    <span style="display:inline-block;padding:6px 20px;background-color:${cfg.badgeBg};color:${cfg.badgeColor};font-size:11px;font-weight:800;letter-spacing:0.08em;border-radius:999px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;text-transform:uppercase;">${e(cfg.label)}</span>
  </td>
</tr></tbody>
</table>`;
}

/**
 * Contractor contact strip shown below the main body on customer-facing emails.
 * Renders phone, email, website, and optional custom footer text.
 */
function contactStrip(contractor: Contractor | undefined, rep?: User): string {
  if (!contractor) return '';
  const phone = getCustomerFacingConsultantPhone(contractor, rep);
  const email = contractor.publicEmail?.trim() || contractor.email || '';
  const website = contractor.publicWebsite?.trim() || contractor.website || '';
  const footer = contractor.emailFooterText?.trim() || '';

  const links: string[] = [];
  if (phone) {
    links.push(
      `<a href="tel:${e(phone)}" style="color:#1B3C6C;font-weight:700;text-decoration:none;font-size:13px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">${e(phone)}</a>`,
    );
  }
  if (email) {
    links.push(
      `<a href="mailto:${e(email)}" style="color:#1B3C6C;font-weight:700;text-decoration:none;font-size:13px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">${e(email)}</a>`,
    );
  }
  if (website) {
    const display = website.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const href = website.startsWith('http') ? website : `https://${website}`;
    links.push(
      `<a href="${e(href)}" target="_blank" style="color:#1B3C6C;font-weight:700;text-decoration:none;font-size:13px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">${e(display)}</a>`,
    );
  }

  if (!links.length && !footer) return '';

  const separator = `<span style="color:#cbd5e1;margin:0 8px;">·</span>`;

  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#eef4ff">
<tbody><tr>
  <td style="padding:18px 28px;background-color:#eef4ff;border-top:1px solid #dbeafe;">
    <p style="margin:0 0 6px 0;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">Contact</p>
    ${links.length ? `<p style="margin:0${footer ? ' 0 6px 0' : ''};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">${links.join(separator)}</p>` : ''}
    ${footer ? `<p style="margin:0;font-size:12px;color:#64748b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">${e(footer)}</p>` : ''}
  </td>
</tr></tbody>
</table>`;
}

/** OntarioReno attribution footer shown on every email. */
function emailFooter(): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f8fafc">
<tbody><tr>
  <td align="center" style="padding:18px 24px;background-color:#f8fafc;border-top:1px solid #e2e8f0;">
    <p style="margin:0;font-size:12px;color:#94a3b8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">Appointment managed through <strong style="color:#64748b;font-weight:700;">OntarioReno</strong></p>
  </td>
</tr></tbody>
</table>`;
}

/**
 * Outer email shell: doctype, <head> with media queries, full-width
 * background table, and the 620 px centred card.
 * Media queries make two-column rows collapse to single-column on mobile.
 */
function shell(inner: string): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <!--[if mso]>
  <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->
  <style type="text/css">
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; border-radius: 0 !important; }
      .col-left  { display: block !important; width: 100% !important; padding: 28px 20px 20px !important; }
      .col-right { display: block !important; width: 100% !important; padding: 20px !important; border-top: 1px solid #e2e8f0 !important; border-left: none !important; }
      .body-cell { padding: 24px 16px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f0f4f8" style="min-height:100%;background-color:#f0f4f8;">
<tbody><tr>
  <td align="center" style="padding:32px 12px 48px 12px;">
    <!--[if mso]><table role="presentation" width="620" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
    <table
      class="email-container"
      role="presentation"
      cellpadding="0"
      cellspacing="0"
      border="0"
      bgcolor="#ffffff"
      style="max-width:620px;width:100%;border-radius:14px;overflow:hidden;background-color:#ffffff;box-shadow:0 4px 32px rgba(15,23,42,0.10);"
    >
      <tbody>
        ${inner}
      </tbody>
    </table>
    <!--[if mso]></td></tr></table><![endif]-->
  </td>
</tr></tbody>
</table>
</body>
</html>`;
}

// ─── Customer-facing template ─────────────────────────────────────────────────

export type CustomerEmailInput = {
  type: CustomerEmailType;
  appointment: Appointment;
  contractor?: Contractor;
  rep?: User;
  contractorName: string;
  /** Signed action URLs. Omit to render the email without action buttons. */
  customerLinks?: CustomerActionLinks;
};

/**
 * Two-column customer email layout (Setmore-style):
 *  LEFT  (58%): status heading, greeting, appointment detail rows, customer notes
 *  RIGHT (42%): contractor logo, contact links, action buttons
 *
 * On mobile (≤620 px) the columns stack via the .col-left / .col-right
 * media-query rules in the shell <style> block.
 */
export function buildCustomerHtml(input: CustomerEmailInput): string {
  const { type, appointment, contractor, rep, contractorName, customerLinks } = input;
  const cfg = STATUS[type];

  const isEvent = isEventAppointment(appointment.appointmentType);
  const apptTypeLabel = APPOINTMENT_TYPE_LABELS[appointment.appointmentType] ?? 'Consultation';
  // For events the title is stored in customerName (there is no separate person).
  const eventTitle = appointment.title?.trim() || appointment.customerName?.trim() || apptTypeLabel;

  // ── Left column: text detail rows ────────────────────────────────────────
  function textRow(label: string, value: string): string {
    return `<tr>
  <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
    <span style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#94a3b8;display:block;margin-bottom:3px;">${label}</span>
    <span style="font-size:14px;font-weight:700;color:#0f172a;">${value}</span>
  </td>
</tr>`;
  }

  const detailTableRows = [
    textRow('Date &amp; Time', e(`${fmtDate(appointment.appointmentDate)} at ${fmtTime(appointment.appointmentTime)}`)),
    textRow('Service', e(apptTypeLabel)),
    isEvent
      ? textRow('Event', e(eventTitle))
      : textRow('Project', e(appointment.projectType || 'Renovation Consultation')),
    rep?.name ? textRow('Provider', e(rep.name)) : '',
    textRow('Contractor', e(contractorName)),
    textRow('Booking ID', e(refId(appointment.id))),
  ].filter(Boolean).join('\n');

  const customerNotes = appointment.customerNotes?.trim();
  const notesSection = customerNotes
    ? `<div style="margin-top:16px;padding:12px 14px;background-color:#f8fafc;border-left:3px solid #cbd5e1;border-radius:0 6px 6px 0;">
        <p style="margin:0 0 3px;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#94a3b8;font-family:sans-serif;">Your Notes</p>
        <p style="margin:0;font-size:13px;color:#475569;line-height:1.6;font-family:sans-serif;">${e(customerNotes)}</p>
       </div>`
    : '';

  // Events get appointment-neutral copy (no "renovation consultation" wording),
  // and aren't greeted by the event title (which isn't a person's name).
  const eventIntro: Record<CustomerEmailType, string> = {
    booking_confirmation: 'Your appointment has been confirmed. We look forward to seeing you.',
    reschedule_notice: 'Your appointment has been rescheduled to the date and time shown below.',
    cancellation_notice: 'Your appointment has been cancelled. Please contact us if you have any questions.',
  };
  const greetingName = isEvent ? '' : appointment.customerName?.trim();
  const introCopy = isEvent ? eventIntro[type] : cfg.intro;

  const leftCol = `<td class="col-left" width="58%" valign="top"
  style="padding:32px 28px 32px 32px;background-color:#ffffff;vertical-align:top;">
  <h2 style="margin:0 0 4px;font-size:22px;font-weight:800;letter-spacing:-0.02em;color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">${e(cfg.label)}</h2>
  <p style="margin:0 0 20px;font-size:14px;color:#64748b;font-family:sans-serif;">Hi ${e(greetingName || 'there')},</p>
  <p style="margin:0 0 20px;font-size:14px;color:#475569;line-height:1.65;font-family:sans-serif;">${e(introCopy)}</p>
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tbody>${detailTableRows}</tbody>
  </table>
  ${notesSection}
  <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;font-family:sans-serif;">Thanks,<br /><strong style="color:#64748b;">${e(contractorName)}</strong></p>
</td>`;

  // ── Right column: logo + contact + buttons ────────────────────────────────
  const rawLogoUrl = contractor?.logoUrl?.trim();
  const hostedLogoUrl =
    rawLogoUrl &&
    (rawLogoUrl.startsWith('http://') || rawLogoUrl.startsWith('https://'))
      ? rawLogoUrl
      : undefined;

  const logoBlock = hostedLogoUrl
    ? `<div style="text-align:center;margin-bottom:16px;">
        <img src="${e(hostedLogoUrl)}" alt="${e(contractorName)}" height="80"
          style="display:inline-block;max-width:160px;max-height:80px;object-fit:contain;border:0;" />
       </div>`
    : `<div style="text-align:center;margin-bottom:14px;">
        <div style="display:inline-block;background:#1B3C6C;border-radius:10px;padding:8px 18px;">
          <span style="font-size:15px;font-weight:800;color:#ffffff;font-family:sans-serif;">${e(contractorName)}</span>
        </div>
       </div>`;

  const phone = getCustomerFacingConsultantPhone(contractor, rep);
  const email = contractor?.publicEmail?.trim() || contractor?.email || '';
  const website = contractor?.publicWebsite?.trim() || contractor?.website || '';
  const websiteDisplay = website.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const websiteHref = website && !website.startsWith('http') ? `https://${website}` : website;

  const contactLinks = [
    phone ? `<p style="margin:0 0 6px;font-size:13px;font-family:sans-serif;"><a href="tel:${e(phone)}" style="color:#1B3C6C;text-decoration:none;font-weight:600;">${e(phone)}</a></p>` : '',
    email ? `<p style="margin:0 0 6px;font-size:13px;font-family:sans-serif;"><a href="mailto:${e(email)}" style="color:#1B3C6C;text-decoration:none;font-weight:600;">Email</a></p>` : '',
    website ? `<p style="margin:0 0 6px;font-size:13px;font-family:sans-serif;"><a href="${e(websiteHref)}" target="_blank" style="color:#1B3C6C;text-decoration:none;font-weight:600;">${e(websiteDisplay)}</a></p>` : '',
  ].filter(Boolean).join('');

  // Rendered only when signed links were supplied — never as unsigned fallbacks.
  const actionButtons = cfg.showActions && customerLinks
    ? `<div style="margin-top:20px;">
        <a href="${e(customerLinks.rescheduleUrl)}" target="_blank"
          style="display:block;margin-bottom:8px;padding:11px 16px;background-color:#1B3C6C;color:#ffffff;font-size:13px;font-weight:700;text-align:center;text-decoration:none;border-radius:8px;font-family:sans-serif;">Reschedule</a>
        <a href="${e(customerLinks.cancelUrl)}" target="_blank"
          style="display:block;padding:11px 16px;background-color:#f1f5f9;color:#475569;font-size:13px;font-weight:700;text-align:center;text-decoration:none;border-radius:8px;font-family:sans-serif;">Cancel Appointment</a>
       </div>`
    : '';

  const rightCol = `<td class="col-right" width="42%" valign="top" bgcolor="#f8fafc"
  style="padding:32px 24px;background-color:#f8fafc;vertical-align:top;border-left:1px solid #e2e8f0;">
  ${logoBlock}
  <p style="margin:0 0 4px;text-align:center;font-size:14px;font-weight:800;color:#0f172a;font-family:sans-serif;">${e(contractorName)}</p>
  <div style="margin-top:12px;text-align:left;">${contactLinks}</div>
  ${actionButtons}
</td>`;

  // Thin branded accent bar at the very top of the card
  const accentBar = `<tr>
  <td colspan="2" height="5" bgcolor="#1B3C6C"
    style="height:5px;line-height:5px;font-size:0;background-color:#1B3C6C;">&nbsp;</td>
</tr>`;

  const twoColRow = `<tr>
  <!--[if mso]><td><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><![endif]-->
  ${leftCol}
  ${rightCol}
  <!--[if mso]></tr></table></td><![endif]-->
</tr>`;

  return shell(`
${accentBar}
${twoColRow}
<tr><td colspan="2">${emailFooter()}</td></tr>
`);
}

// ─── Rep assignment template ──────────────────────────────────────────────────

export type RepAssignmentEmailInput = {
  appointment: Appointment;
  contractor?: Contractor;
  deal?: Deal;
  rep?: User;
  contractorName: string;
};

/**
 * Internal email notifying a sales rep that a consultation has been assigned
 * to them. Includes full customer contact details and deal information that
 * are never shared with the customer or contractor.
 */
export function buildRepAssignmentHtml(input: RepAssignmentEmailInput): string {
  const { appointment, contractor, deal, rep, contractorName } = input;

  const location =
    [appointment.address, appointment.city].filter(Boolean).join(', ') || 'Not provided';
  const dateTime = `${fmtDate(appointment.appointmentDate)} at ${fmtTime(appointment.appointmentTime)}`;
  const dealValue = deal
    ? new Intl.NumberFormat('en-CA', {
        currency: 'CAD',
        style: 'currency',
        maximumFractionDigits: 0,
      }).format(deal.estimatedJobValue)
    : null;

  const detailRows = [
    detailRow('Customer', e(appointment.customerName || 'TBD'), '#1B3C6C'),
    detailRow('Phone', e(appointment.phone || 'Not provided'), '#1B3C6C'),
    detailRow('Email', e(appointment.email || 'Not provided'), '#1B3C6C'),
    detailRow('Location', e(location), '#1B3C6C'),
    detailRow('Date &amp; Time', e(dateTime), '#1B3C6C'),
    detailRow('Project Type', e(appointment.projectType || 'Not specified'), '#1B3C6C'),
    detailRow('Assigned Contractor', e(contractorName), '#1B3C6C'),
    dealValue ? detailRow('Estimated Deal Value', e(dealValue), '#1B3C6C') : '',
    deal ? detailRow('Financing', deal.financingRequired ? 'Required' : 'Not required', '#1B3C6C') : '',
    detailRow('Reference', e(refId(appointment.id)), '#1B3C6C', true),
  ].filter(Boolean);

  const internalNotes = (appointment.internalNotes || appointment.notes || '').trim();
  const customerNotes = appointment.customerNotes?.trim();

  const bodyRow = `<tr>
  <td class="body-cell" style="padding:28px 28px 36px 28px;background-color:#ffffff;">
    <p style="margin:0 0 6px 0;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#94a3b8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">Hi ${e(rep?.name || 'Sales Rep')}</p>
    <p style="margin:0 0 24px 0;font-size:15px;color:#475569;line-height:1.65;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
      A renovation consultation has been assigned to you. Please review the customer and appointment details below and prepare accordingly.
    </p>
    ${detailCard(detailRows)}
    ${internalNotes ? noteBlock('Internal Notes', internalNotes, '#f8fafc', '#1B3C6C', '#64748b', '#475569') : ''}
    ${customerNotes ? noteBlock('Customer Notes', customerNotes, '#fffbeb', '#f59e0b', '#92400e', '#78350f') : ''}
  </td>
</tr>`;

  return shell(`
<tr>
  <td align="center" bgcolor="#1B3C6C" style="padding:28px 24px;background-color:#1B3C6C;">
    <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;letter-spacing:0.10em;text-transform:uppercase;color:rgba(255,255,255,0.55);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">OntarioReno &middot; Internal</p>
    <p style="margin:0;font-size:20px;font-weight:800;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">Consultation Assigned to You</p>
  </td>
</tr>
${bodyRow}
<tr><td>${emailFooter()}</td></tr>
`);
}

// ─── Appointment reminder template ───────────────────────────────────────────

export type AppointmentReminderEmailInput = {
  appointment: Appointment;
  rep: User;
  reminderMinutes: number;
};

/**
 * Internal email sent to the assigned rep X minutes before their appointment.
 */
export function buildAppointmentReminderHtml(input: AppointmentReminderEmailInput): string {
  const { appointment, rep, reminderMinutes } = input;

  const location = [appointment.address, appointment.city].filter(Boolean).join(', ') || 'No location set';
  const dateTime = `${fmtDate(appointment.appointmentDate)} at ${fmtTime(appointment.appointmentTime)}`;
  const title = appointment.customerName || appointment.title || 'Appointment';

  const detailRows = [
    detailRow('Appointment', e(title), '#1B3C6C'),
    detailRow('Date &amp; Time', e(dateTime), '#1B3C6C'),
    detailRow('Location', e(location), '#1B3C6C'),
    appointment.projectType ? detailRow('Project Type', e(appointment.projectType), '#1B3C6C') : '',
    appointment.phone ? detailRow('Phone', e(appointment.phone), '#1B3C6C') : '',
    detailRow('Reference', e(refId(appointment.id)), '#1B3C6C', true),
  ].filter(Boolean);

  const notesSection = appointment.internalNotes?.trim()
    ? noteBlock('Prep Notes', appointment.internalNotes.trim(), '#f8fafc', '#1B3C6C', '#64748b', '#475569')
    : '';

  const bodyRow = `<tr>
  <td class="body-cell" style="padding:28px 28px 36px 28px;background-color:#ffffff;">
    <p style="margin:0 0 6px 0;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#94a3b8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">Hi ${e(rep.name)}</p>
    <p style="margin:0 0 24px 0;font-size:15px;color:#475569;line-height:1.65;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
      You have an appointment starting in <strong style="color:#0f172a;">${reminderMinutes} minutes</strong>. Here are the details:
    </p>
    ${detailCard(detailRows)}
    ${notesSection}
  </td>
</tr>`;

  return shell(`
<tr>
  <td align="center" bgcolor="#1B3C6C" style="padding:28px 24px;background-color:#1B3C6C;">
    <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;letter-spacing:0.10em;text-transform:uppercase;color:rgba(255,255,255,0.55);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">OntarioReno &middot; Reminder</p>
    <p style="margin:0;font-size:20px;font-weight:800;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">Appointment in ${reminderMinutes} minutes</p>
  </td>
</tr>
${bodyRow}
<tr><td>${emailFooter()}</td></tr>
`);
}

// ─── Contractor dispatch template ─────────────────────────────────────────────

export type ContractorDispatchHtmlInput = {
  appointment: Appointment;
  contractor: Contractor;
  deal?: Deal;
  dispatch: ContractorDispatch;
  estimatedProjectRange?: string;
  safeSummary?: string;
};

/**
 * Outbound email to a contractor presenting an anonymised renovation
 * opportunity. No homeowner PII is included — exact address and contact
 * details are withheld until the contractor accepts and is assigned.
 */
export function buildContractorDispatchHtml(input: ContractorDispatchHtmlInput): string {
  const { appointment, contractor, deal, dispatch, estimatedProjectRange, safeSummary } = input;

  const contactName = contractor.contactName || contractor.companyName;
  const city = appointment.city || deal?.city || 'Ontario';
  const projectType = appointment.projectType || deal?.projectType || 'Renovation project';
  const financingRequired = dispatch.financingRequired ?? deal?.financingRequired ?? false;
  const range =
    estimatedProjectRange ||
    dispatch.estimatedProjectRange ||
    'To be confirmed';
  const summary = safeSummary || dispatch.safeSummary || '';

  const detailRows = [
    detailRow('Service Area', e(city), '#1B3C6C'),
    detailRow('Project Type', e(projectType), '#1B3C6C'),
    detailRow('Estimated Range', e(range), '#1B3C6C'),
    detailRow('Financing', financingRequired ? 'Required' : 'Not required', '#1B3C6C', true),
  ];

  const bodyRow = `<tr>
  <td class="body-cell" style="padding:28px 28px 36px 28px;background-color:#ffffff;">
    <p style="margin:0 0 6px 0;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#94a3b8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">Hi ${e(contactName)}</p>
    <p style="margin:0 0 24px 0;font-size:15px;color:#475569;line-height:1.65;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
      OntarioReno has a renovation opportunity that may be a strong fit for your team. Please review the details below and let us know if you are interested.
    </p>
    ${detailCard(detailRows)}
    ${summary ? noteBlock('Project Summary', summary, '#f8fafc', '#1B3C6C', '#64748b', '#475569') : ''}
    <div style="margin-top:18px;padding:14px 18px;background-color:#fefce8;border-radius:8px;border:1px solid #fde68a;">
      <p style="margin:0;font-size:13px;color:#78350f;line-height:1.55;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
        <strong>Privacy note:</strong> Homeowner contact details and exact address are not shared until the opportunity is accepted and assigned to your team.
      </p>
    </div>
    <p style="margin:22px 0 0 0;font-size:14px;color:#475569;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
      Please reply to this email or contact your OntarioReno representative to indicate your interest.
    </p>
  </td>
</tr>`;

  return shell(`
<tr>
  <td align="center" bgcolor="#1B3C6C" style="padding:28px 24px;background-color:#1B3C6C;">
    <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;letter-spacing:0.10em;text-transform:uppercase;color:rgba(255,255,255,0.55);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">OntarioReno Broker Portal</p>
    <p style="margin:0;font-size:20px;font-weight:800;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">New Renovation Opportunity</p>
  </td>
</tr>
${bodyRow}
<tr><td>${emailFooter()}</td></tr>
`);
}
