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

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
 * Infer the portal base URL at runtime so reschedule/cancel links point to
 * the correct environment (local dev vs. Vercel preview vs. production).
 */
function baseUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'https://ontarioreno.ca';
}

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
 * If the contractor has a publicly hosted logoUrl (http/https), the logo is
 * shown centred at ≤72 px tall. Base64 data URLs are intentionally excluded
 * because email clients (Gmail, Outlook, Apple Mail) block data: src values
 * for security — the broken-image icon would appear instead of the logo.
 * When no valid hosted URL exists, the company name appears as reversed-out text.
 */
function contractorHeader(contractor: Contractor | undefined, contractorName: string): string {
  const rawLogoUrl = contractor?.logoUrl?.trim();
  // Only use the logo if it's a hosted URL — data: URLs don't render in email.
  const logoUrl =
    rawLogoUrl && (rawLogoUrl.startsWith('http://') || rawLogoUrl.startsWith('https://'))
      ? rawLogoUrl
      : undefined;
  const brand = logoUrl
    ? `<img src="${e(logoUrl)}" alt="${e(contractorName)}" height="72"
        style="display:block;margin:0 auto 12px auto;max-width:200px;max-height:72px;object-fit:contain;" />`
    : `<div style="display:inline-block;background:rgba(255,255,255,0.12);border-radius:10px;padding:10px 22px;margin-bottom:12px;">
        <span style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.01em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">${e(contractorName)}</span>
       </div>`;

  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#1B3C6C">
<tbody><tr>
  <td align="center" style="padding:36px 24px 24px 24px;background-color:#1B3C6C;">
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
function contactStrip(contractor: Contractor | undefined): string {
  if (!contractor) return '';
  const phone = contractor.publicPhone?.trim() || contractor.phone || '';
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
 * background table, and the 600 px centred card.
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
      .body-cell { padding: 24px 16px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f0f4f8" style="min-height:100%;background-color:#f0f4f8;">
<tbody><tr>
  <td align="center" style="padding:32px 12px 48px 12px;">
    <!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
    <table
      class="email-container"
      role="presentation"
      cellpadding="0"
      cellspacing="0"
      border="0"
      bgcolor="#ffffff"
      style="max-width:600px;width:100%;border-radius:14px;overflow:hidden;background-color:#ffffff;box-shadow:0 4px 32px rgba(15,23,42,0.10);"
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
};

/**
 * Builds the HTML body for all three customer-facing email types:
 * booking confirmation, reschedule notice, and cancellation notice.
 *
 * The template renders:
 *  1. Contractor-branded dark-blue header (logo or company name)
 *  2. Status badge pill
 *  3. Body: greeting, intro paragraph, appointment details card
 *  4. Optional: customer notes, action buttons (reschedule / cancel)
 *  5. Contractor contact strip
 *  6. OntarioReno footer
 */
export function buildCustomerHtml(input: CustomerEmailInput): string {
  const { type, appointment, contractor, rep, contractorName } = input;
  const cfg = STATUS[type];
  const origin = baseUrl();
  const rescheduleUrl = `${origin}/portal/consultation/${appointment.id}/reschedule`;
  const cancelUrl = `${origin}/portal/consultation/${appointment.id}/cancel`;

  const apptTypeLabels: Record<string, string> = {
    home_visit: 'Home Visit',
    phone_consultation: 'Phone Consultation',
    video_consultation: 'Video Consultation',
  };
  const apptTypeLabel = apptTypeLabels[appointment.appointmentType] ?? 'Consultation';
  const dateTime = `${fmtDate(appointment.appointmentDate)} at ${fmtTime(appointment.appointmentTime)}`;

  const detailRows = [
    detailRow('Date &amp; Time', e(dateTime), cfg.accent),
    detailRow('Consultation Type', e(apptTypeLabel), cfg.accent),
    detailRow('Project Type', e(appointment.projectType || 'Renovation Consultation'), cfg.accent),
    rep?.name ? detailRow('Sales Representative', e(rep.name), cfg.accent) : '',
    detailRow('Contractor', e(contractorName), cfg.accent),
    detailRow('Reference', e(refId(appointment.id)), cfg.accent, true),
  ].filter(Boolean);

  const customerNotes = appointment.customerNotes?.trim();
  const notesHtml = customerNotes
    ? noteBlock('Your Notes', customerNotes, '#f8fafc', '#cbd5e1', '#64748b', '#475569')
    : '';

  const actionsHtml = cfg.showActions
    ? `<div style="margin-top:28px;">
        ${ctaButton('Reschedule Consultation', rescheduleUrl, '#1B3C6C', '#ffffff')}
        ${ctaButton('Cancel Consultation', cancelUrl, '#f1f5f9', '#475569')}
       </div>`
    : '';

  const bodyRow = `<tr>
  <td class="body-cell" style="padding:28px 28px 36px 28px;background-color:#ffffff;">
    <h1 style="margin:0 0 8px 0;font-size:24px;font-weight:800;color:#0f172a;letter-spacing:-0.02em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">${e(cfg.label)}</h1>
    <p style="margin:0 0 24px 0;font-size:15px;color:#475569;line-height:1.65;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
      Hi ${e(appointment.customerName || 'there')},<br /><br />${e(cfg.intro)}
    </p>
    ${detailCard(detailRows)}
    ${notesHtml}
    ${actionsHtml}
  </td>
</tr>`;

  return shell(`
<tr><td>${contractorHeader(contractor, contractorName)}</td></tr>
<tr><td>${statusBadge(cfg)}</td></tr>
${bodyRow}
<tr><td>${contactStrip(contractor)}</td></tr>
<tr><td>${emailFooter()}</td></tr>
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
