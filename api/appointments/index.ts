import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../lib/prisma.js';
import { requireAuth } from '../../lib/auth.js';
import { Resend } from 'resend';

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

  // ── Appointment reminder cron (runs every 5 min) ──────────────────────────
  if (req.method === 'GET' && req.query['_cron'] === 'reminder-check') {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || req.headers.authorization !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    // Work in Eastern time (Ontario). UTC-4 EDT / UTC-5 EST.
    // We approximate with a runtime check using Intl so it handles DST automatically.
    const nowUtc = new Date();
    const easternStr = nowUtc.toLocaleString('en-CA', { timeZone: 'America/Toronto', hour12: false });
    // "YYYY-MM-DD, HH:MM:SS"
    const [datePart, timePart] = easternStr.split(', ');
    const todayEastern = datePart.replace(/\//g, '-').trim();
    const [hStr, mStr] = (timePart || '').split(':');
    const nowMinutes = parseInt(hStr, 10) * 60 + parseInt(mStr, 10);

    // Fetch all unreminded, upcoming appointments today
    const candidates = await prisma.appointment.findMany({
      where: {
        appointmentDate: todayEastern,
        reminderSentAt: null,
        status: { in: ['scheduled', 'confirmed'] },
      },
      include: { assignedRep: true },
    });

    const toRemind = candidates.filter((apt) => {
      if (!apt.appointmentTime) return false;
      const [ah, am] = apt.appointmentTime.split(':').map(Number);
      const aptMinutes = ah * 60 + am;
      const triggerMinutes = aptMinutes - (apt.reminderMinutes ?? 30);
      const diff = nowMinutes - triggerMinutes;
      // Fire within a ±3 min window around the trigger time
      return diff >= -1 && diff <= 4;
    });

    if (toRemind.length === 0) return res.status(200).json({ ok: true, reminded: 0 });

    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.EMAIL_FROM ?? 'OntarioReno <info@ontarioreno.ca>';

    // Build reminder HTML inline (avoids importing browser-only helpers server-side)
    function fmtTime(t: string) {
      const [h, m] = t.split(':').map(Number);
      const period = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${String(m).padStart(2, '0')} ${period}`;
    }
    function fmtDate(d: string) {
      try {
        return new Date(`${d}T12:00:00`).toLocaleDateString('en-CA', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        });
      } catch { return d; }
    }

    const results = await Promise.allSettled(
      toRemind.map(async (apt) => {
        const rep = apt.assignedRep;
        const title = apt.customerName || apt.title || 'Appointment';
        const location = [apt.address, apt.city].filter(Boolean).join(', ') || 'No location set';
        const dateTime = `${fmtDate(apt.appointmentDate)} at ${fmtTime(apt.appointmentTime)}`;
        const mins = apt.reminderMinutes ?? 30;

        const tasks: Promise<unknown>[] = [];

        // Email to rep
        if (rep?.email) {
          const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#f0f4f8;padding:32px 12px;">
<div style="max-width:580px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
  <div style="background:#1B3C6C;padding:28px 24px;text-align:center;">
    <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.55);">OntarioReno · Reminder</p>
    <p style="margin:0;font-size:20px;font-weight:800;color:#fff;">Appointment in ${mins} minutes</p>
  </div>
  <div style="padding:28px;">
    <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#94a3b8;">Hi ${rep.name}</p>
    <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.65;">You have an appointment starting in <strong style="color:#0f172a;">${mins} minutes</strong>.</p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
      <tr><td width="4" bgcolor="#1B3C6C" style="width:4px;background:#1B3C6C;">&nbsp;</td><td style="padding:13px 18px;border-bottom:1px solid #f1f5f9;"><p style="margin:0 0 3px;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;">Appointment</p><p style="margin:0;font-size:15px;font-weight:600;color:#0f172a;">${title}</p></td></tr>
      <tr><td width="4" bgcolor="#1B3C6C" style="width:4px;background:#1B3C6C;">&nbsp;</td><td style="padding:13px 18px;border-bottom:1px solid #f1f5f9;"><p style="margin:0 0 3px;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;">Date &amp; Time</p><p style="margin:0;font-size:15px;font-weight:600;color:#0f172a;">${dateTime}</p></td></tr>
      <tr><td width="4" bgcolor="#1B3C6C" style="width:4px;background:#1B3C6C;">&nbsp;</td><td style="padding:13px 18px;"><p style="margin:0 0 3px;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;">Location</p><p style="margin:0;font-size:15px;font-weight:600;color:#0f172a;">${location}</p></td></tr>
    </table>
    ${apt.internalNotes?.trim() ? `<div style="margin-top:18px;padding:15px 18px;background:#f8fafc;border-left:3px solid #1B3C6C;border-radius:0 8px 8px 0;"><p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#64748b;">Prep Notes</p><p style="margin:0;font-size:14px;color:#475569;line-height:1.65;">${apt.internalNotes.trim()}</p></div>` : ''}
  </div>
  <div style="padding:18px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;"><p style="margin:0;font-size:12px;color:#94a3b8;">Appointment managed through <strong style="color:#64748b;">OntarioReno</strong></p></div>
</div></body></html>`;

          tasks.push(resend.emails.send({
            from,
            to: rep.email,
            subject: `Reminder: ${title} in ${mins} minutes`,
            html,
            text: `Hi ${rep.name},\n\nYou have an appointment in ${mins} minutes.\n\nAppointment: ${title}\nDate & Time: ${dateTime}\nLocation: ${location}\n\nOntarioReno`,
          }));
        }

        // Push notification to rep
        const subs = await prisma.pushSubscription.findMany({ where: { userId: apt.assignedRepId } });
        if (subs.length > 0) {
          tasks.push(...subs.map((sub) =>
            sendPush(sub.endpoint, sub.p256dh, sub.auth, {
              title: `Reminder: ${title} in ${mins} min`,
              body: `${dateTime} · ${location}`,
              url: '/portal/appointments',
              tag: `reminder-${apt.id}`,
            })
          ));
        }

        await Promise.allSettled(tasks);

        // Mark reminder as sent
        await prisma.appointment.update({
          where: { id: apt.id },
          data: { reminderSentAt: nowUtc.toISOString() },
        });
      })
    );

    const reminded = results.filter((r) => r.status === 'fulfilled').length;
    return res.status(200).json({ ok: true, reminded });
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
          postalCode: data.postalCode ?? '',
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
      const patch: Record<string, unknown> = {};
      if (data.name !== undefined) patch.name = data.name;
      if (data.phone !== undefined) patch.phone = data.phone;
      if (data.email !== undefined) patch.email = data.email;
      if (data.address !== undefined) patch.address = data.address;
      if (data.city !== undefined) patch.city = data.city;
      if (data.postalCode !== undefined) patch.postalCode = data.postalCode;
      if (data.projectTypes !== undefined) patch.projectTypes = data.projectTypes;
      if (data.internalNotes !== undefined) patch.internalNotes = data.internalNotes;
      const client = await prisma.client.update({
        where: { id: data.id },
        data: patch,
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
        postalCode: data.postalCode ?? '',
        projectType: data.projectType,
        assignedRepId: data.assignedRepId,
        contractorId: data.contractorId ?? null,
        appointmentDate: data.appointmentDate,
        appointmentTime: data.appointmentTime,
        durationMinutes: data.durationMinutes ?? 60,
        appointmentType: data.appointmentType ?? 'home_visit',
        reminderMinutes: data.reminderMinutes ?? 30,
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
            postalCode: appointment.postalCode || client.postalCode,
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
            postalCode: appointment.postalCode ?? '',
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
