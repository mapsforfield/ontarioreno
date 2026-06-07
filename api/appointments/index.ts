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
    // ── Client list ──
    if (req.query['_resource'] === 'clients') {
      const clients = await prisma.client.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return res.status(200).json(clients);
    }

    const appointments = await prisma.appointment.findMany({
      orderBy: { appointmentDate: 'desc' },
    });
    return res.status(200).json(appointments);
  }

  if (req.method === 'POST') {
    const data = req.body;

    // ── Client CRUD actions ──
    if (data._action === 'create_client') {
      const client = await prisma.client.create({
        data: {
          name: data.name,
          phone: data.phone ?? '',
          email: data.email ?? '',
          address: data.address ?? '',
          city: data.city ?? '',
          projectTypes: data.projectTypes ?? [],
          internalNotes: data.internalNotes ?? '',
          source: 'manual',
          createdByUserId: user.id,
        },
      });
      return res.status(201).json(client);
    }

    if (data._action === 'update_client') {
      if (!data.id) return res.status(400).json({ error: 'Missing id.' });
      const client = await prisma.client.update({
        where: { id: data.id },
        data: {
          name: data.name,
          phone: data.phone ?? '',
          email: data.email ?? '',
          address: data.address ?? '',
          city: data.city ?? '',
          projectTypes: data.projectTypes ?? [],
          internalNotes: data.internalNotes ?? '',
        },
      });
      return res.status(200).json(client);
    }

    if (data._action === 'delete_client') {
      if (!data.id) return res.status(400).json({ error: 'Missing id.' });
      // Admin only
      if (user.role !== 'admin') return res.status(403).json({ error: 'Forbidden.' });
      await prisma.client.delete({ where: { id: data.id } });
      return res.status(200).json({ ok: true });
    }

    // ── Transfer appointment to another rep ──
    if (data._action === 'transfer_appointment') {
      if (!data.id) return res.status(400).json({ error: 'Missing id.' });
      if (!data.toRepId) return res.status(400).json({ error: 'Missing toRepId.' });

      const appt = await prisma.appointment.findUnique({ where: { id: data.id } });
      if (!appt) return res.status(404).json({ error: 'Appointment not found.' });

      // Only the currently assigned rep or an admin can transfer
      if (user.role !== 'admin' && appt.assignedRepId !== user.id) {
        return res.status(403).json({ error: 'You can only transfer your own consultations.' });
      }

      // Verify target rep exists
      const toRep = await prisma.user.findUnique({ where: { id: data.toRepId } });
      if (!toRep) return res.status(404).json({ error: 'Target rep not found.' });

      const updated = await prisma.appointment.update({
        where: { id: data.id },
        data: { assignedRepId: data.toRepId },
      });
      return res.status(200).json(updated);
    }

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
    // ── Auto-upsert client profile ──
    // Match by email if provided, otherwise create a new profile.
    // Link the appointment back to the client.
    try {
      let client = appointment.email
        ? await prisma.client.findFirst({ where: { email: appointment.email } })
        : null;

      if (client) {
        // Update existing client with any new info
        client = await prisma.client.update({
          where: { id: client.id },
          data: {
            name: appointment.customerName || client.name,
            phone: appointment.phone || client.phone,
            address: appointment.address || client.address,
            city: appointment.city || client.city,
            projectTypes: appointment.projectType
              ? Array.from(new Set([...client.projectTypes, appointment.projectType]))
              : client.projectTypes,
          },
        });
      } else {
        client = await prisma.client.create({
          data: {
            name: appointment.customerName,
            phone: appointment.phone ?? '',
            email: appointment.email ?? '',
            address: appointment.address ?? '',
            city: appointment.city ?? '',
            projectTypes: appointment.projectType ? [appointment.projectType] : [],
            internalNotes: '',
            source: 'appointment',
            createdByUserId: user.id,
          },
        });
      }

      // Link appointment → client
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { clientId: client.id },
      });
    } catch {
      // Client auto-linking is non-critical
    }

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
