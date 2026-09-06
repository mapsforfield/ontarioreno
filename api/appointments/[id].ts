import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../lib/prisma.js';
import { requireAuth } from '../../lib/auth.js';
import { sendAppointmentNotification } from '../../lib/appointment-notify.js';
import { mergeNotes } from '../../lib/consultation-notes.js';
import { resolvesRescheduleRequest } from '../../lib/sms-reply-resolution.js';
import {
  reminderContextFor,
  resyncAppointmentReminders,
  suppressPendingReminders,
} from '../../lib/reminder-resync.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const { id } = req.query as { id: string };

  if (req.method === 'GET') {
    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) return res.status(404).json({ error: 'Not found.' });
    return res.status(200).json(appointment);
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    const { createdAt, updatedAt, id: _id, dealId: rawDealId, ...rest } = req.body;
    void createdAt; void updatedAt; void _id;
    const data = {
      ...rest,
      ...(rawDealId !== undefined ? { dealId: rawDealId || null } : {}),
    };

    // Fetch before-state so we can detect what changed
    const before = await prisma.appointment.findUnique({ where: { id } });

    // ── Take the "Wants to move" chip down once a rep has answered it ──
    // See lib/sms-reply-resolution.ts. The chip is driven by smsReplyStatus,
    // which is deliberately not the booking's `status` — but nothing used to
    // clear it either, so a rep who phoned the homeowner, settled it and set
    // the status by hand kept the amber badge forever. This runs server-side so
    // it holds for every surface that saves an appointment, not just the
    // details panel. Only the open-work flag comes down: smsReplyBody and
    // smsReplyAt stay, because what the homeowner wrote is history.
    const rescheduleResolved = resolvesRescheduleRequest(before, data);
    if (rescheduleResolved) data.smsReplyStatus = '';

    const appointment = await prisma.appointment.update({
      where: { id },
      data,
    });

    // The Activity row for this is written by the portal store, which already
    // logs every rep edit and can label the resolution the moment it happens —
    // see updateAppointment() in src/portal/data/store.tsx. Writing one here
    // too would put two rows in the history for one decision.

    // ── Notes sync: propagate a note edit to the linked deal and client ──
    if (data.internalNotes !== undefined || data.notes !== undefined) {
      const notes = String(data.internalNotes ?? data.notes ?? '');
      try {
        if (appointment.dealId) {
          await prisma.deal.update({ where: { id: appointment.dealId }, data: { notes } }).catch(() => {});
        }
        // The client profile is the homeowner's running history across every
        // consultation they have ever booked, so this sync MERGES. It used to
        // overwrite, which is how a repeat customer's new booking wiped out
        // everything the rep knew from the last one. See lib/consultation-notes.ts.
        const syncClientNotes = async (where: Record<string, unknown>) => {
          const existing = await prisma.client.findFirst({ where, select: { id: true, internalNotes: true } });
          if (!existing) return;
          const merged = mergeNotes(existing.internalNotes, notes);
          if (merged === (existing.internalNotes ?? '')) return;
          await prisma.client.update({ where: { id: existing.id }, data: { internalNotes: merged } });
        };
        if (appointment.clientId) {
          await syncClientNotes({ id: appointment.clientId });
        } else if (appointment.email?.trim()) {
          await syncClientNotes({ email: appointment.email.trim() });
        }
      } catch {
        // notes sync is non-critical
      }
    }

    // Change detection is pure, and both the reminder resync and the rep
    // notification below depend on it, so it sits outside either try block.
    const dateChanged = before && data.appointmentDate !== undefined && data.appointmentDate !== before.appointmentDate;
    const timeChanged = before && data.appointmentTime !== undefined && data.appointmentTime !== before.appointmentTime;
    const wasCancelled = before && data.status === 'cancelled' && before.status !== 'cancelled';
    const wasRescheduled = before && data.status === 'rescheduled' && before.status !== 'rescheduled';
    const wasMoved = (dateChanged || timeChanged) && !wasCancelled && !wasRescheduled;

    let event: 'rescheduled' | 'cancelled' | 'moved' | null = null;
    if (wasCancelled) event = 'cancelled';
    else if (wasRescheduled) event = 'rescheduled';
    else if (wasMoved) event = 'moved';

    // ── Keep the queued reminder texts honest ──
    // Queued reminders have the old date written into their body, so a move
    // that leaves them alone texts the homeowner about a visit that is not
    // happening. This is its own try block, ahead of the rep alerts: a missing
    // VAPID key must not be the reason a homeowner gets the wrong date.
    if (event) {
      try {
        if (event === 'cancelled') {
          await suppressPendingReminders(prisma, appointment.id, 'appointment_cancelled');
        } else if (!dateChanged && !timeChanged) {
          // Flagged as rescheduled but no new slot recorded yet. The old date
          // is known to be wrong and the new one is not known at all, so the
          // correct number of queued reminders is none; confirming the slot
          // re-queues them through the branch below.
          await suppressPendingReminders(prisma, appointment.id, 'awaiting_reschedule_confirmation');
        } else {
          await resyncAppointmentReminders(
            prisma,
            reminderContextFor(appointment),
            `appointment_${event}`
          );
        }
      } catch (err) {
        // Loud, unlike the notification failures below: a resync that did not
        // happen means a wrong text is still queued against a real homeowner.
        console.error('[appointments/patch] reminder resync failed', appointment.id, err);
      }
    }

    // Best-effort notification to assigned rep
    try {
      const repId = appointment.assignedRepId;
      const rep = await prisma.user.findUnique({ where: { id: repId }, select: { name: true, email: true } });

      if (event && rep?.email) {
        await sendAppointmentNotification({
          event,
          repName: rep.name,
          repEmail: rep.email,
          customerName: appointment.customerName,
          appointmentDate: appointment.appointmentDate,
          appointmentTime: appointment.appointmentTime,
          address: appointment.address,
          city: appointment.city,
          title: appointment.title,
          previousDate: (dateChanged && before) ? before.appointmentDate : undefined,
          previousTime: (timeChanged && before) ? before.appointmentTime : undefined,
        });
      }

      // Push notification for move/reschedule/cancel
      if (event) {
        const webpush = await import('web-push');
        webpush.default.setVapidDetails(
          `mailto:${process.env.VAPID_CONTACT_EMAIL ?? 'noreply@ontarioreno.ca'}`,
          process.env.VAPID_PUBLIC_KEY!,
          process.env.VAPID_PRIVATE_KEY!
        );
        const subs = await prisma.pushSubscription.findMany({ where: { userId: repId } });
        const pushTitle = event === 'cancelled' ? 'Appointment cancelled'
          : event === 'rescheduled' ? 'Appointment rescheduled'
          : 'Appointment moved';
        await Promise.allSettled(
          subs.map((sub) =>
            webpush.default.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              JSON.stringify({
                title: pushTitle,
                body: `${appointment.customerName || appointment.title} — ${appointment.appointmentDate}`,
                url: '/portal/appointments',
                tag: `appt-update-${appointment.id}`,
              })
            )
          )
        );
      }
    } catch {
      // notifications are non-critical
    }

    return res.status(200).json(appointment);
  }

  if (req.method === 'DELETE') {
    const existing = await prisma.appointment.findUnique({ where: { id }, select: { assignedRepId: true } });
    if (!existing) return res.status(404).json({ error: 'Not found.' });
    if (user.role !== 'admin' && existing.assignedRepId !== user.id) {
      return res.status(403).json({ error: 'You can only delete your own consultations.' });
    }
    // Outbox rows hold the appointment id as a plain column, not a relation, so
    // deleting the appointment — soft or hard — orphans its pending reminders
    // rather than removing them, and the drain would happily text a homeowner
    // about a visit that no longer exists in the system at all.
    await suppressPendingReminders(prisma, id, 'appointment_deleted');

    // `?purge=1` permanently removes; default is a soft-delete (trash bin).
    if (req.query['purge'] === '1') {
      await prisma.appointment.delete({ where: { id } });
      return res.status(200).json({ ok: true, purged: true });
    }
    try {
      await prisma.appointment.update({ where: { id }, data: { deletedAt: new Date() } });
    } catch {
      await prisma.$executeRawUnsafe(
        'ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3)'
      );
      await prisma.appointment.update({ where: { id }, data: { deletedAt: new Date() } });
    }
    return res.status(200).json({ ok: true, trashed: true });
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
