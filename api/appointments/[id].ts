import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../lib/prisma.js';
import { requireAuth } from '../../lib/auth.js';
import { sendAppointmentNotification } from '../../lib/appointment-notify.js';

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

    const appointment = await prisma.appointment.update({
      where: { id },
      data,
    });

    // Best-effort notification to assigned rep
    try {
      const repId = appointment.assignedRepId;
      const rep = await prisma.user.findUnique({ where: { id: repId }, select: { name: true, email: true } });

      const dateChanged = before && data.appointmentDate !== undefined && data.appointmentDate !== before.appointmentDate;
      const timeChanged = before && data.appointmentTime !== undefined && data.appointmentTime !== before.appointmentTime;
      const wasCancelled = before && data.status === 'cancelled' && before.status !== 'cancelled';
      const wasRescheduled = before && data.status === 'rescheduled' && before.status !== 'rescheduled';
      const wasMoved = (dateChanged || timeChanged) && !wasCancelled && !wasRescheduled;

      let event: 'rescheduled' | 'cancelled' | 'moved' | null = null;
      if (wasCancelled) event = 'cancelled';
      else if (wasRescheduled) event = 'rescheduled';
      else if (wasMoved) event = 'moved';

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
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only.' });
    }
    await prisma.appointment.delete({ where: { id } });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
