import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';
import { prisma } from './lib/prisma.js';

/**
 * Customer-facing endpoint for reschedule and cancellation requests.
 *
 * This function is called directly by the public-facing ConsultationReschedule
 * and ConsultationCancel pages — no portal auth required.
 *
 * On a reschedule request it:
 *   1. Updates the appointment in the Neon database (status → "rescheduled",
 *      new date/time stored in appointmentDate/appointmentTime).
 *   2. Sends a notification email to the business inbox AND to the assigned
 *      rep (if their email is on file).
 *
 * On a cancel request it:
 *   1. Updates the appointment in the Neon database (status → "cancelled").
 *   2. Sends notification emails as above.
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
const BUSINESS_INBOX = extractAddress(EMAIL_FROM);

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

function buildRescheduleNotification(
  p: CustomerRequestBody,
  customerName: string,
  repName: string | null,
): { subject: string; text: string } {
  const ref = p.appointmentId.replace(/-/g, '').slice(-8).toUpperCase();
  const subject = `Reschedule Request — ${customerName} — Consultation #${ref}`;
  const lines = [
    `A customer has submitted a reschedule request for their consultation.`,
    ``,
    `Customer       : ${customerName}`,
    `Assigned rep   : ${repName ?? 'Unassigned'}`,
    `Appointment ID : ${p.appointmentId}`,
    `Reference      : #${ref}`,
    `Preferred date : ${fmtDate(p.preferredDate ?? '')}`,
    `Preferred time : ${p.preferredTime}`,
    p.notes ? `Additional notes: ${p.notes}` : ``,
    ``,
    `The appointment has been marked as "Rescheduled" in the portal.`,
    `Log in to confirm the new date and time with the customer.`,
  ].filter((l, i, arr) => !(l === '' && arr[i - 1] === ''));
  return { subject, text: lines.join('\n') };
}

function buildCancelNotification(
  p: CustomerRequestBody,
  customerName: string,
  repName: string | null,
): { subject: string; text: string } {
  const ref = p.appointmentId.replace(/-/g, '').slice(-8).toUpperCase();
  const subject = `Cancellation Request — ${customerName} — Consultation #${ref}`;
  const lines = [
    `A customer has requested to cancel their consultation.`,
    ``,
    `Customer       : ${customerName}`,
    `Assigned rep   : ${repName ?? 'Unassigned'}`,
    `Appointment ID : ${p.appointmentId}`,
    `Reference      : #${ref}`,
    `Reason         : ${p.reason?.trim() || 'Not provided'}`,
    ``,
    `The appointment has been marked as "Cancelled" in the portal.`,
    `Contact the customer if follow-up is needed.`,
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

  // ── 1. Look up the appointment from the database ─────────────────────────────
  const appointment = await prisma.appointment.findUnique({
    where: { id: payload.appointmentId },
    include: {
      assignedRep: { select: { name: true, email: true } },
    },
  }).catch(() => null);

  // Appointment not found is non-fatal — we still update if possible and always
  // notify.  Unknown IDs (e.g. old Google Calendar imports) fall back gracefully.
  const customerName = appointment?.customerName ?? 'Customer';
  const repName = appointment?.assignedRep?.name ?? null;
  const repEmail = appointment?.assignedRep?.email ?? null;

  // ── 2. Update the appointment status in the database ─────────────────────────
  if (appointment) {
    const dbUpdate: Record<string, unknown> = {};

    if (payload.type === 'cancel') {
      dbUpdate.status = 'cancelled';
    } else {
      dbUpdate.status = 'rescheduled';
      if (payload.preferredDate) dbUpdate.appointmentDate = payload.preferredDate;
      if (payload.preferredTime) dbUpdate.appointmentTime = payload.preferredTime;
    }

    await prisma.appointment.update({
      where: { id: payload.appointmentId },
      data: dbUpdate,
    }).catch((err: unknown) => {
      // Non-fatal — log and continue so the notification email still sends.
      console.error('Failed to update appointment in DB:', err);
    });
  }

  // ── 3. Build notification email ───────────────────────────────────────────────
  const { subject, text } =
    payload.type === 'reschedule'
      ? buildRescheduleNotification(payload, customerName, repName)
      : buildCancelNotification(payload, customerName, repName);

  // Recipients: always the business inbox; also CC the rep if they have an email
  const toAddresses = [BUSINESS_INBOX];
  if (repEmail && repEmail.toLowerCase() !== BUSINESS_INBOX.toLowerCase()) {
    toAddresses.push(repEmail);
  }

  // ── 4. Send notification email(s) ────────────────────────────────────────────
  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: toAddresses,
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
