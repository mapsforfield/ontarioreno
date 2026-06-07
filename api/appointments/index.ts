import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../lib/prisma.js';
import { requireAuth } from '../../lib/auth.js';

async function sendPush(
  endpoint: string,
  p256dh: string,
  auth: string,
  payload: object
) {
  const webpush = await import('web-push');
  webpush.default.setVapidDetails(
    `mailto:${process.env.VAPID_CONTACT_EMAIL ?? 'noreply@ontarioreno.ca'}`,
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  return webpush.default.sendNotification(
    { endpoint, keys: { p256dh, auth } },
    JSON.stringify(payload)
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ── Daily morning briefing cron (no user auth — verified by CRON_SECRET) ──
  if (req.method === 'GET' && req.query['_cron'] === 'morning-brief') {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || req.headers.authorization !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const today = new Date().toISOString().slice(0, 10);
    const appointments = await prisma.appointment.findMany({
      where: { appointmentDate: today },
      orderBy: { appointmentTime: 'asc' },
    });

    const byRep: Record<string, typeof appointments> = {};
    for (const apt of appointments) {
      if (apt.assignedRepId) {
        if (!byRep[apt.assignedRepId]) byRep[apt.assignedRepId] = [];
        byRep[apt.assignedRepId].push(apt);
      }
    }

    const repIds = Object.keys(byRep);
    if (repIds.length === 0) return res.status(200).json({ ok: true, sent: 0 });

    const subs = await prisma.pushSubscription.findMany({
      where: { userId: { in: repIds } },
    });

    const results = await Promise.allSettled(
      subs.map((sub) => {
        const repApts = byRep[sub.userId] ?? [];
        const count = repApts.length;
        const first = repApts[0];
        const body =
          count === 1
            ? `${first.customerName} at ${first.appointmentTime || 'time TBD'}`
            : `${count} consultations — first at ${first.appointmentTime || 'time TBD'}`;
        return sendPush(sub.endpoint, sub.p256dh, sub.auth, {
          title: `Good morning — ${count} consultation${count !== 1 ? 's' : ''} today`,
          body,
          url: '/portal/appointments',
          tag: 'daily-brief',
        });
      })
    );

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    return res.status(200).json({ ok: true, sent });
  }

  const user = await requireAuth(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    const appointments = await prisma.appointment.findMany({
      orderBy: { appointmentDate: 'desc' },
    });
    return res.status(200).json(appointments);
  }

  if (req.method === 'POST') {
    const data = req.body;
    const appointment = await prisma.appointment.create({
      data: {
        dealId: data.dealId || null,
        customerName: data.customerName,
        phone: data.phone ?? '',
        email: data.email ?? '',
        address: data.address ?? '',
        city: data.city ?? '',
        projectType: data.projectType,
        assignedRepId: data.assignedRepId,
        contractorId: data.contractorId ?? null,
        appointmentDate: data.appointmentDate,
        appointmentTime: data.appointmentTime,
        durationMinutes: data.durationMinutes ?? 60,
        appointmentType: data.appointmentType ?? 'home_visit',
        status: data.status ?? 'scheduled',
        consultationStage: data.consultationStage ?? 'consultation_scheduled',
        location: data.location ?? '',
        notes: data.notes ?? '',
        customerNotes: data.customerNotes ?? '',
        internalNotes: data.internalNotes ?? '',
        source: data.source ?? 'manual',
        title: data.title ?? null,
        outcomeSubmitted: false,
        estimatedProjectValue: data.estimatedProjectValue ?? 0,
        financingNeeded: data.financingNeeded ?? null,
        homeownerInterestLevel: data.homeownerInterestLevel ?? null,
        nextStep: data.nextStep ?? 'no_action',
        recommendedContractorId: data.recommendedContractorId ?? null,
        closeProbability: data.closeProbability ?? 0,
        outcomeNotes: data.outcomeNotes ?? '',
        objections: data.objections ?? '',
        followUpDate: data.followUpDate ?? '',
        createdByUserId: user.id,
      },
    });
    // Best-effort push to assigned rep
    try {
      const subs = await prisma.pushSubscription.findMany({
        where: { userId: appointment.assignedRepId },
      });
      if (subs.length > 0) {
        await Promise.allSettled(
          subs.map((sub) =>
            sendPush(sub.endpoint, sub.p256dh, sub.auth, {
              title: 'New consultation booked',
              body: `${appointment.customerName} — ${appointment.appointmentDate} at ${appointment.appointmentTime || 'time TBD'}`,
              url: '/portal/appointments',
              tag: 'new-appointment',
            })
          )
        );
      }
    } catch {
      // push is non-critical
    }

    return res.status(201).json(appointment);
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
