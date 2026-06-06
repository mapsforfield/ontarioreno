import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

/**
 * Customer-facing endpoint for reschedule and cancellation requests.
 *
 * This function is called directly by the public-facing ConsultationReschedule
 * and ConsultationCancel pages — no portal auth required. It sends a
 * notification email to the business inbox so a rep can action the request
 * and update the appointment in the portal.
 *
 * Security: RESEND_API_KEY lives only in Vercel env vars, never in frontend
 * code. The notification recipient is derived from EMAIL_FROM (server-side),
 * so callers cannot redirect email to arbitrary addresses.
 */

const EMAIL_FROM = process.env.EMAIL_FROM ?? 'OntarioReno <info@ontarioreno.ca>';
const MAX_FIELD_LENGTH = 2_000;

/** Extract the bare email address from "Display Name <email@host>" */
function extractAddress(from: string): string {
  const match = from.match(/<([^\s@>]+@[^\s@>]+\.[^\s@>]+)>/);
  return match ? match[1] : from.trim();
}

/** Notifications always go to the business inbox. */
const NOTIFY_TO = extractAddress(EMAIL_FROM);

type CustomerRequestType = 'reschedule' | 'cancel';

type CustomerRequestBody = {
  type: CustomerRequestType;
  appointmentId: string;
  preferredDate?: string;
  preferredTime?: string;
  notes?: string;
  reason?: string;
};

function isValidDate(d: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(Date.parse(d));
}

function validate(
  data: unknown,
): { error: string } | { ok: true; payload: CustomerRequestBody } {
  if (!data || typeof data !== 'object') {
    return { error: 'Invalid request body.' };
  }
  const { type, appointmentId, preferredDate, preferredTime, notes, reason } =
    data as Record<string, unknown>;

  if (type !== 'reschedule' && type !== 'cancel') {
    return { error: 'Request type must be "reschedule" or "cancel".' };
  }
  if (typeof appointmentId !== 'string' || !appointmentId.trim()) {
    return { error: 'Missing appointment ID.' };
  }
  if (type === 'reschedule') {
    if (typeof preferredDate !== 'string' || !isValidDate(preferredDate)) {
      return { error: 'Invalid or missing preferred date.' };
    }
    if (typeof preferredTime !== 'string' || !preferredTime.trim()) {
      return { error: 'Missing preferred time.' };
    }
  }
  if (
    notes !== undefined &&
    (typeof notes !== 'string' || notes.length > MAX_FIELD_LENGTH)
  ) {
    return { error: 'Notes field exceeds maximum length.' };
  }
  if (
    reason !== undefined &&
    (typeof reason !== 'string' || reason.length > MAX_FIELD_LENGTH)
  ) {
    return { error: 'Reason field exceeds maximum length.' };
  }

  return {
    ok: true,
    payload: {
      type: type as CustomerRequestType,
      appointmentId: appointmentId.trim(),
      preferredDate:
        typeof preferredDate === 'string' ? preferredDate : undefined,
      preferredTime:
        typeof preferredTime === 'string' ? preferredTime.trim() : undefined,
      notes: typeof notes === 'string' ? notes.trim() : undefined,
      reason: typeof reason === 'string' ? reason.trim() : undefined,
    },
  };
}

function fmtDate(d: string): string {
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

function buildRescheduleNotification(p: CustomerRequestBody): {
  subject: string;
  text: string;
} {
  const ref = p.appointmentId.replace(/-/g, '').slice(-8).toUpperCase();
  const subject = `Reschedule Request — Consultation #${ref}`;
  const lines = [
    `A customer has submitted a reschedule request for their consultation.`,
    ``,
    `Appointment ID : ${p.appointmentId}`,
    `Reference      : #${ref}`,
    `Preferred date : ${fmtDate(p.preferredDate ?? '')}`,
    `Preferred time : ${p.preferredTime}`,
    p.notes ? `Additional notes: ${p.notes}` : ``,
    ``,
    `Action required: log in to the OntarioReno portal, update the appointment`,
    `to the requested date and time, then confirm the change with the customer.`,
  ].filter((l, i, arr) => !(l === '' && arr[i - 1] === ''));
  return { subject, text: lines.join('\n') };
}

function buildCancelNotification(p: CustomerRequestBody): {
  subject: string;
  text: string;
} {
  const ref = p.appointmentId.replace(/-/g, '').slice(-8).toUpperCase();
  const subject = `Cancellation Request — Consultation #${ref}`;
  const lines = [
    `A customer has requested to cancel their consultation.`,
    ``,
    `Appointment ID : ${p.appointmentId}`,
    `Reference      : #${ref}`,
    `Reason         : ${p.reason?.trim() || 'Not provided'}`,
    ``,
    `Action required: log in to the OntarioReno portal and mark the appointment`,
    `as cancelled. Contact the customer if follow-up is needed.`,
  ];
  return { subject, text: lines.join('\n') };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, service: 'customer-request' });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY is not configured.');
    return res.status(500).json({ error: 'Email service is not configured.' });
  }

  const result = validate(req.body);
  if ('error' in result) {
    return res.status(400).json({ error: result.error });
  }

  const { payload } = result;
  const { subject, text } =
    payload.type === 'reschedule'
      ? buildRescheduleNotification(payload)
      : buildCancelNotification(payload);

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: NOTIFY_TO,
      subject,
      text,
    });

    if (error) {
      console.error('Resend error:', error);
      return res
        .status(502)
        .json({ error: error.message ?? 'Failed to send notification.' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Unexpected error in customer-request:', err);
    return res
      .status(500)
      .json({ error: 'Unexpected error. Please try again.' });
  }
}
