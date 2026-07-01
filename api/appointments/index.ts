import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../lib/prisma.js';
import { requireAuth, denyContractor } from '../../lib/auth.js';
import { Resend } from 'resend';
import { sendAppointmentNotification } from '../../lib/appointment-notify.js';
import { presignPutUrl, presignGetUrl, deleteObject, isR2Configured } from '../../lib/r2.js';
import { ensureSchema, withSchema } from '../../lib/schema.js';
import { randomUUID } from 'node:crypto';

// Self-healing creation for the client-video metadata table (R2 holds the bytes).
const CREATE_CLIENT_VIDEO_TABLE =
  'CREATE TABLE IF NOT EXISTS "ClientVideo" (' +
  '"id" TEXT PRIMARY KEY, "clientId" TEXT NOT NULL, "key" TEXT NOT NULL, ' +
  '"label" TEXT NOT NULL DEFAULT \'Before\', "fileName" TEXT NOT NULL DEFAULT \'\', ' +
  '"contentType" TEXT NOT NULL DEFAULT \'video/mp4\', "sizeBytes" BIGINT NOT NULL DEFAULT 0, ' +
  '"uploadedByUserId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)';

const MAX_VIDEO_BYTES = 250 * 1024 * 1024; // 250 MB per clip

// Runs the one-time event-city cleanup at most once per warm instance.
let eventCityBackfillDone = false;

type VideoRow = {
  id: string; clientId: string; key: string; label: string; fileName: string;
  contentType: string; sizeBytes: bigint | number; uploadedByUserId: string | null; createdAt: Date;
};

// Convert a ClientVideo row into a JSON-safe object with a fresh view URL.
function serializeVideo(v: VideoRow) {
  return {
    id: v.id,
    clientId: v.clientId,
    label: v.label,
    fileName: v.fileName,
    contentType: v.contentType,
    sizeBytes: Number(v.sizeBytes),
    uploadedByUserId: v.uploadedByUserId,
    createdAt: v.createdAt,
    url: presignGetUrl(v.key),
  };
}

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

// ─── Contractor-scoped, read-only responses ─────────────────────────────────
// A contractor account sees the FULL sales calendar so the team looks busy, but
// deliberately ANONYMIZED: no client contact details (phone/email/address), no
// contractor attribution (they must not see which jobs belong to whom), and no
// notes of any kind. Only enough to show that a consultation exists.
// The scrub happens server-side so these fields never leave the database for a
// contractor account — there is nothing to recover in dev tools.
function scrubAppointmentForContractor(a: Record<string, unknown>, repName: string) {
  return {
    id: a.id,
    customerName: a.customerName,
    projectType: a.projectType,
    appointmentDate: a.appointmentDate,
    appointmentTime: a.appointmentTime,
    durationMinutes: a.durationMinutes,
    appointmentType: a.appointmentType,
    status: a.status,
    repName,
  };
}

function scrubClientForContractor(c: Record<string, unknown>) {
  return {
    id: c.id,
    name: c.name,
    projectTypes: c.projectTypes,
  };
}

async function handleContractorGet(req: VercelRequest, res: VercelResponse) {
  // Contractor accounts see the FULL calendar + client roster, but anonymized —
  // no contact details and no contractor attribution (see scrub helpers above).

  // Client roster: every client, names only (no phone/email/address).
  if (req.query['_resource'] === 'clients') {
    const clients = await withSchema(() => prisma.client.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' } }));
    return res.status(200).json(clients.map((c) => scrubClientForContractor(c as unknown as Record<string, unknown>)));
  }

  // Anything else the contractor asks for that isn't the calendar → not available.
  if (req.query['_resource']) return res.status(403).json({ error: 'Not available for contractor accounts.' });

  // Default: the whole sales calendar (every rep / every contractor), scrubbed.
  const appts = await withSchema(() => prisma.appointment.findMany({
    where: { deletedAt: null },
    orderBy: { appointmentDate: 'desc' },
  }));
  const repIds = [...new Set(appts.map((a) => a.assignedRepId).filter(Boolean))] as string[];
  const reps = repIds.length ? await prisma.user.findMany({ where: { id: { in: repIds } }, select: { id: true, name: true } }) : [];
  const repName = new Map(reps.map((r) => [r.id, r.name]));
  return res.status(200).json(appts.map((a) => scrubAppointmentForContractor(a as unknown as Record<string, unknown>, repName.get(a.assignedRepId) ?? '')));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ── Schema reconcile cron (no user auth — verified by CRON_SECRET) ──
  // A daily safety net that re-applies the generated schema DDL, in case a
  // deploy-time apply was skipped (e.g. a DB blip during build).
  if (req.method === 'GET' && req.query['_cron'] === 'ensure-schema') {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || req.headers.authorization !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    await ensureSchema();
    return res.status(200).json({ ok: true });
  }

  // ── Daily morning briefing cron (no user auth — verified by CRON_SECRET) ──
  if (req.method === 'GET' && req.query['_cron'] === 'morning-brief') {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || req.headers.authorization !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    // Daily schema reconcile (folded into an existing cron so we don't exceed the
    // Hobby plan's cron limit). Belt-and-suspenders behind the deploy-time apply.
    await ensureSchema();

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

    let sent = 0;
    if (repIds.length > 0) {
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
      sent = results.filter((r) => r.status === 'fulfilled').length;
    }

    // ── Follow-up digest: email each rep their deals due (or overdue) today ──
    let followUpEmailsSent = 0;
    try {
      const openStatuses = ['new_lead', 'appointment_booked', 'quoted', 'negotiating'];
      const dueDeals = await prisma.deal.findMany({
        where: {
          nextFollowUpDate: { lte: today, gt: '' },
          status: { in: openStatuses },
          isHistorical: false,
        },
        orderBy: { nextFollowUpDate: 'asc' },
      });

      const dealsByRep: Record<string, typeof dueDeals> = {};
      for (const deal of dueDeals) {
        if (!dealsByRep[deal.assignedRepId]) dealsByRep[deal.assignedRepId] = [];
        dealsByRep[deal.assignedRepId].push(deal);
      }

      const dueRepIds = Object.keys(dealsByRep);
      if (dueRepIds.length > 0 && process.env.RESEND_API_KEY) {
        const reps = await prisma.user.findMany({
          where: { id: { in: dueRepIds }, active: true },
          select: { id: true, name: true, email: true },
        });
        const resend = new Resend(process.env.RESEND_API_KEY);
        const from = process.env.EMAIL_FROM ?? 'OntarioReno <info@ontarioreno.ca>';
        const fmtMoney = (v: number) =>
          new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(v);

        const emailResults = await Promise.allSettled(
          reps
            .filter((rep) => rep.email)
            .map((rep) => {
              const repDeals = dealsByRep[rep.id];
              const rows = repDeals
                .map((deal) => {
                  const overdue = deal.nextFollowUpDate < today;
                  return `<tr>
                    <td width="4" style="width:4px;background:${overdue ? '#b91c1c' : '#1B3C6C'};">&nbsp;</td>
                    <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;">
                      <p style="margin:0;font-size:15px;font-weight:700;color:#0f172a;">${deal.homeownerName}</p>
                      <p style="margin:2px 0 0;font-size:13px;color:#64748b;">${[deal.city, deal.projectType].filter(Boolean).join(' · ')} · ${fmtMoney(deal.estimatedJobValue)}</p>
                      <p style="margin:4px 0 0;font-size:12px;font-weight:700;color:${overdue ? '#b91c1c' : '#475569'};">${overdue ? `Overdue — was due ${deal.nextFollowUpDate}` : 'Due today'}</p>
                    </td>
                  </tr>`;
                })
                .join('');
              const count = repDeals.length;
              const subject = `Follow-ups due today: ${count} deal${count !== 1 ? 's' : ''}`;
              const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#f0f4f8;padding:32px 12px;">
<div style="max-width:580px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
  <div style="background:#1B3C6C;padding:28px 24px;text-align:center;">
    <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.6);">OntarioReno · Daily Follow-Ups</p>
    <p style="margin:0;font-size:20px;font-weight:800;color:#fff;">${count} follow-up${count !== 1 ? 's' : ''} need${count === 1 ? 's' : ''} your attention</p>
  </div>
  <div style="padding:28px;">
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">Hi ${rep.name}, here are the deals with follow-ups due today or overdue:</p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">${rows}</table>
    <p style="margin:20px 0 0;text-align:center;"><a href="https://ontarioreno.ca/portal/deals" style="display:inline-block;background:#1B3C6C;color:#fff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:8px;">Open Pipeline</a></p>
  </div>
  <div style="padding:18px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;"><p style="margin:0;font-size:12px;color:#94a3b8;">Sent automatically by <strong style="color:#64748b;">OntarioReno</strong> each morning</p></div>
</div></body></html>`;
              const text = [
                `Hi ${rep.name},`,
                '',
                `You have ${count} follow-up${count !== 1 ? 's' : ''} due:`,
                ...repDeals.map((deal) => {
                  const overdue = deal.nextFollowUpDate < today;
                  return `- ${deal.homeownerName} (${[deal.city, deal.projectType].filter(Boolean).join(', ')}) — ${fmtMoney(deal.estimatedJobValue)}${overdue ? ` — OVERDUE since ${deal.nextFollowUpDate}` : ' — due today'}`;
                }),
                '',
                'Open the pipeline: https://ontarioreno.ca/portal/deals',
              ].join('\n');
              return resend.emails.send({ from, to: rep.email, subject, html, text });
            })
        );
        followUpEmailsSent = emailResults.filter((r) => r.status === 'fulfilled').length;
      }
    } catch (err) {
      console.error('[morning-brief] follow-up digest failed:', err);
    }

    // ── Task reminders: email each rep their to-do items due today / overdue ──
    let taskEmailsSent = 0;
    try {
      const todayEnd = `${today}T23:59:59`;
      let dueTasks: Array<{ userId: string; title: string; dueAt: string | null }> = [];
      try {
        dueTasks = await prisma.task.findMany({
          where: { done: false, dueAt: { not: null, lte: todayEnd } },
          select: { userId: true, title: true, dueAt: true },
          orderBy: { dueAt: 'asc' },
        });
      } catch {
        // Task table may not exist yet — nothing to remind.
        dueTasks = [];
      }
      const tasksByUser: Record<string, typeof dueTasks> = {};
      for (const t of dueTasks) {
        if (!tasksByUser[t.userId]) tasksByUser[t.userId] = [];
        tasksByUser[t.userId].push(t);
      }
      const taskUserIds = Object.keys(tasksByUser);
      if (taskUserIds.length > 0 && process.env.RESEND_API_KEY) {
        const taskUsers = await prisma.user.findMany({
          where: { id: { in: taskUserIds }, active: true },
          select: { id: true, name: true, email: true },
        });
        const resend = new Resend(process.env.RESEND_API_KEY);
        const from = process.env.EMAIL_FROM ?? 'OntarioReno <info@ontarioreno.ca>';
        const taskResults = await Promise.allSettled(
          taskUsers
            .filter((u) => u.email)
            .map((u) => {
              const myTasks = tasksByUser[u.id];
              const rows = myTasks
                .map((t) => {
                  const overdue = (t.dueAt ?? '').slice(0, 10) < today;
                  const due = t.dueAt && t.dueAt.includes('T')
                    ? new Date(t.dueAt).toLocaleString('en-CA', { hour: 'numeric', minute: '2-digit', hour12: true })
                    : 'Today';
                  return `<tr><td width="4" style="width:4px;background:${overdue ? '#b45309' : '#1B3C6C'};">&nbsp;</td><td style="padding:11px 16px;border-bottom:1px solid #f1f5f9;"><p style="margin:0;font-size:15px;font-weight:700;color:#0f172a;">${t.title}</p><p style="margin:3px 0 0;font-size:12px;font-weight:700;color:${overdue ? '#b45309' : '#64748b'};">${overdue ? `Overdue${t.dueAt && t.dueAt.includes('T') ? ` · was ${due}` : ''}` : `Due ${due}`}</p></td></tr>`;
                })
                .join('');
              const count = myTasks.length;
              const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#f0f4f8;padding:32px 12px;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
  <div style="background:#1B3C6C;padding:26px 24px;text-align:center;">
    <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.6);">OntarioReno · Your To-Do</p>
    <p style="margin:0;font-size:20px;font-weight:800;color:#fff;">${count} task${count !== 1 ? 's' : ''} for today</p>
  </div>
  <div style="padding:26px;">
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">Hi ${u.name}, here's your to-do list for today:</p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">${rows}</table>
    <p style="margin:20px 0 0;text-align:center;"><a href="https://ontarioreno.ca/portal/tasks" style="display:inline-block;background:#1B3C6C;color:#fff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:8px;">Open My Tasks</a></p>
  </div>
  <div style="padding:18px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;"><p style="margin:0;font-size:12px;color:#94a3b8;">Sent each morning by <strong style="color:#64748b;">OntarioReno</strong></p></div>
</div></body></html>`;
              const text = [`Hi ${u.name},`, '', `You have ${count} task${count !== 1 ? 's' : ''} due:`, ...myTasks.map((t) => `- ${t.title}`), '', 'Open: https://ontarioreno.ca/portal/tasks'].join('\n');
              return resend.emails.send({ from, to: u.email, subject: `Your to-do list — ${count} task${count !== 1 ? 's' : ''} today`, html, text });
            })
        );
        taskEmailsSent = taskResults.filter((r) => r.status === 'fulfilled').length;
      }
    } catch (err) {
      console.error('[morning-brief] task reminders failed:', err);
    }

    return res.status(200).json({ ok: true, sent, followUpEmailsSent, taskEmailsSent });
  }

  // ── Daily business recap cron — emails the business inbox a portal briefing ──
  if (
    req.method === 'GET' &&
    (req.query['_cron'] === 'daily-recap' ||
      req.query['_cron'] === 'weekly-recap')
  ) {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || req.headers.authorization !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    if (!process.env.RESEND_API_KEY) {
      console.error('[daily-recap] RESEND_API_KEY is not configured.');
      return res.status(500).json({ error: 'RESEND_API_KEY is not configured.' });
    }

    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const todayStr = now.toISOString().slice(0, 10);
    const yesterdayStr = dayAgo.toISOString().slice(0, 10);

    const [users, wonDeals, recentAppointments, openDeals, activities] =
      await Promise.all([
      prisma.user.findMany({ where: { role: 'rep' }, select: { id: true, name: true } }),
      prisma.deal.findMany({
        where: { status: 'won', isHistorical: false, updatedAt: { gte: dayAgo } },
        select: { homeownerName: true, estimatedJobValue: true, assignedRepId: true },
      }),
      prisma.appointment.findMany({
        where: { appointmentDate: { gte: yesterdayStr, lte: todayStr } },
        select: { status: true, assignedRepId: true },
      }),
      prisma.deal.findMany({
        where: {
          status: { in: ['new_lead', 'contacted', 'appointment_booked', 'quoted', 'negotiating'] },
          isHistorical: false,
          deletedAt: null,
        },
        select: { estimatedJobValue: true },
      }),
      prisma.activity.findMany({
        where: { createdAt: { gte: dayAgo } },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          actionLabel: true,
          actorName: true,
          actorRole: true,
          entityType: true,
          createdAt: true,
        },
      }),
    ]);

    const repName = (id: string) => users.find((u) => u.id === id)?.name ?? 'Unassigned';
    const wonValue = wonDeals.reduce((sum, d) => sum + (d.estimatedJobValue || 0), 0);
    const noShows = recentAppointments.filter((a) => a.status === 'no_show').length;
    const consultations = recentAppointments.length;
    const completedConsultations = recentAppointments.filter((a) => a.status === 'completed').length;
    const openPipelineValue = openDeals.reduce((sum, d) => sum + (d.estimatedJobValue || 0), 0);

    // Top rep by wins in the last 24 hours.
    const winsByRep: Record<string, number> = {};
    for (const d of wonDeals) winsByRep[d.assignedRepId] = (winsByRep[d.assignedRepId] ?? 0) + 1;
    const topRepEntry = Object.entries(winsByRep).sort((a, b) => b[1] - a[1])[0];
    const topRep = topRepEntry ? `${repName(topRepEntry[0])} (${topRepEntry[1]} win${topRepEntry[1] !== 1 ? 's' : ''})` : '—';

    const fmtMoney = (v: number) =>
      new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(v);
    const rangeLabel = `${dayAgo.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })} – ${now.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}`;
    const esc = (value: unknown) =>
      String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');

    const stat = (label: string, value: string, accent: string) =>
      `<td style="padding:6px;" width="50%"><div style="border:1px solid #e2e8f0;border-radius:10px;padding:16px;"><p style="margin:0;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#94a3b8;">${esc(label)}</p><p style="margin:6px 0 0;font-size:26px;font-weight:800;color:${accent};">${esc(value)}</p></div></td>`;

    const wonRows = wonDeals
      .slice(0, 12)
      .map((d) => `<tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:14px;color:#0f172a;font-weight:600;">${esc(d.homeownerName)}</td><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:14px;color:#10b981;font-weight:700;text-align:right;">${esc(fmtMoney(d.estimatedJobValue || 0))}</td><td style="padding:8px 0 8px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;text-align:right;">${esc(repName(d.assignedRepId))}</td></tr>`)
      .join('');

    const activityRows = activities
      .map((activity) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;">
          <p style="margin:0;font-size:14px;color:#0f172a;font-weight:700;">${esc(activity.actionLabel)}</p>
          <p style="margin:2px 0 0;font-size:12px;color:#64748b;">${esc(activity.actorName)} · ${esc(activity.entityType)} · ${esc(activity.createdAt.toLocaleString('en-CA', { timeZone: 'America/Toronto' }))}</p>
        </td>
      </tr>`)
      .join('');

    const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#f0f4f8;padding:32px 12px;">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
  <div style="background:#1B3C6C;padding:28px 24px;text-align:center;">
    <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.55);">OntarioReno · Daily Portal Briefing</p>
    <p style="margin:0;font-size:22px;font-weight:800;color:#fff;">What happened in the portal</p>
    <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,.7);">${esc(rangeLabel)}</p>
  </div>
  <div style="padding:24px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
      <tr>${stat('Consultations', String(consultations), '#1B3C6C')}${stat('Deals Won', String(wonDeals.length), '#10b981')}</tr>
      <tr>${stat('Won Value', fmtMoney(wonValue), '#10b981')}${stat('No-shows', String(noShows), noShows > 0 ? '#b45309' : '#1B3C6C')}</tr>
      <tr>${stat('Completed Consultations', String(completedConsultations), '#1B3C6C')}${stat('Open Pipeline', fmtMoney(openPipelineValue), '#1B3C6C')}</tr>
    </table>
    <div style="margin-top:16px;border:1px solid #e2e8f0;border-radius:10px;padding:16px;">
      <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#94a3b8;">Top Rep</p>
      <p style="margin:6px 0 0;font-size:18px;font-weight:800;color:#0f172a;">${esc(topRep)}</p>
    </div>
    ${wonRows ? `<div style="margin-top:20px;"><p style="margin:0 0 8px;font-size:13px;font-weight:800;color:#334155;">Deals won in the last 24 hours</p><table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">${wonRows}</table></div>` : ''}
    ${activityRows ? `<div style="margin-top:20px;"><p style="margin:0 0 8px;font-size:13px;font-weight:800;color:#334155;">Recent portal activity</p><table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">${activityRows}</table></div>` : '<p style="margin:20px 0 0;font-size:14px;color:#64748b;">No activity was logged in the last 24 hours.</p>'}
    <p style="margin:22px 0 0;text-align:center;"><a href="https://ontarioreno.ca/portal/dashboard" style="display:inline-block;background:#1B3C6C;color:#fff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:8px;">Open Portal</a></p>
  </div>
  <div style="padding:18px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;"><p style="margin:0;font-size:12px;color:#94a3b8;">Sent automatically every morning by <strong style="color:#64748b;">OntarioReno</strong></p></div>
</div></body></html>`;

    const text = [
      `OntarioReno — Daily Portal Briefing (${rangeLabel})`,
      ``,
      `Consultations: ${consultations}`,
      `Deals won: ${wonDeals.length} (${fmtMoney(wonValue)})`,
      `No-shows: ${noShows}`,
      `Completed consultations: ${completedConsultations}`,
      `Open pipeline: ${fmtMoney(openPipelineValue)}`,
      `Top rep: ${topRep}`,
      ``,
      `Recent activity:`,
      ...(activities.length
        ? activities.map((activity) => `- ${activity.actorName}: ${activity.actionLabel}`)
        : ['- No activity logged in the last 24 hours.']),
      ``,
      `Open the portal: https://ontarioreno.ca/portal/dashboard`,
    ].join('\n');

    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const from = process.env.EMAIL_FROM ?? 'OntarioReno <info@ontarioreno.ca>';
      await resend.emails.send({ from, to: 'info@ontarioreno.ca', subject: `Daily Portal Briefing — ${rangeLabel}`, html, text });
      return res.status(200).json({ ok: true, emailed: 'info@ontarioreno.ca', consultations, activities: activities.length, won: wonDeals.length });
    } catch (err) {
      console.error('[daily-recap] failed:', err);
      return res.status(500).json({ error: 'Failed to send daily recap.' });
    }
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

        // Email to the client (homeowner) — a friendly confirmation reminder
        const clientEmail = apt.email?.trim();
        const clientName = apt.customerName?.trim() || 'there';
        if (clientEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
          const repLine = rep?.name ? `Your OntarioReno consultant, ${rep.name}, is looking forward to meeting you.` : 'Your OntarioReno consultant is looking forward to meeting you.';
          const clientHtml = `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#f0f4f8;padding:32px 12px;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
  <div style="background:#1B3C6C;padding:28px 24px;text-align:center;">
    <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.55);">OntarioReno</p>
    <p style="margin:0;font-size:21px;font-weight:800;color:#fff;">Your consultation is coming up</p>
  </div>
  <div style="padding:28px;">
    <p style="margin:0 0 16px;font-size:16px;color:#334155;line-height:1.6;">Hi ${clientName},</p>
    <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.65;">This is a friendly reminder about your upcoming renovation consultation. ${repLine}</p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
      <tr><td width="4" bgcolor="#1B3C6C" style="width:4px;background:#1B3C6C;">&nbsp;</td><td style="padding:14px 18px;border-bottom:1px solid #f1f5f9;"><p style="margin:0 0 3px;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;">When</p><p style="margin:0;font-size:15px;font-weight:600;color:#0f172a;">${dateTime}</p></td></tr>
      <tr><td width="4" bgcolor="#1B3C6C" style="width:4px;background:#1B3C6C;">&nbsp;</td><td style="padding:14px 18px;"><p style="margin:0 0 3px;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;">Where</p><p style="margin:0;font-size:15px;font-weight:600;color:#0f172a;">${location}</p></td></tr>
    </table>
    <p style="margin:20px 0 0;font-size:14px;color:#64748b;line-height:1.6;">Need to reschedule? Just reply to this email and we'll sort it out.</p>
  </div>
  <div style="padding:18px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;"><p style="margin:0;font-size:12px;color:#94a3b8;">See you soon — <strong style="color:#64748b;">OntarioReno</strong></p></div>
</div></body></html>`;
          tasks.push(resend.emails.send({
            from,
            to: clientEmail,
            replyTo: rep?.email || undefined,
            subject: `Reminder: your OntarioReno consultation — ${dateTime}`,
            html: clientHtml,
            text: `Hi ${clientName},\n\nA friendly reminder about your upcoming renovation consultation.\n\nWhen: ${dateTime}\nWhere: ${location}\n\nNeed to reschedule? Just reply to this email.\n\nOntarioReno`,
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

  // Contractor accounts: read-only, full calendar but anonymized (no contact
  // details, no contractor attribution, no notes).
  if (user.role === 'contractor') {
    if (req.method !== 'GET') return res.status(403).json({ error: 'Not available for contractor accounts.' });
    return handleContractorGet(req, res);
  }

  if (req.method === 'GET') {
    // ── Client list ──
    if (req.query['_resource'] === 'clients') {
      const clients = await withSchema(() =>
        prisma.client.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' } })
      );
      return res.status(200).json(clients);
    }

    // ── Google Places: address autocomplete (key stays server-side) ──
    if (req.query['_resource'] === 'places_autocomplete') {
      const apiKey = process.env.GOOGLE_PLACES_API_KEY;
      const input = String(req.query['input'] ?? '').trim();
      const token = String(req.query['token'] ?? '');
      if (!apiKey || input.length < 3) return res.status(200).json({ suggestions: [] });
      try {
        const r = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey },
          body: JSON.stringify({ input, includedRegionCodes: ['ca'], ...(token ? { sessionToken: token } : {}) }),
        });
        const j = (await r.json()) as { suggestions?: Array<{ placePrediction?: { placeId?: string; text?: { text?: string } } }> };
        const suggestions = (j.suggestions ?? [])
          .map((s) => ({ placeId: s.placePrediction?.placeId ?? '', description: s.placePrediction?.text?.text ?? '' }))
          .filter((s) => s.placeId && s.description);
        return res.status(200).json({ suggestions });
      } catch {
        return res.status(200).json({ suggestions: [] });
      }
    }

    // ── Google Places: resolve a picked place into address parts ──
    if (req.query['_resource'] === 'places_details') {
      const apiKey = process.env.GOOGLE_PLACES_API_KEY;
      const placeId = String(req.query['placeId'] ?? '');
      const token = String(req.query['token'] ?? '');
      if (!apiKey || !placeId) return res.status(400).json({ error: 'Missing placeId.' });
      try {
        const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}${token ? `?sessionToken=${encodeURIComponent(token)}` : ''}`;
        const r = await fetch(url, {
          headers: { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': 'addressComponents,formattedAddress' },
        });
        const j = (await r.json()) as {
          formattedAddress?: string;
          addressComponents?: Array<{ longText?: string; shortText?: string; types?: string[] }>;
        };
        const comps = j.addressComponents ?? [];
        const get = (type: string) => comps.find((c) => (c.types ?? []).includes(type));
        const streetNum = get('street_number')?.longText ?? '';
        const route = get('route')?.longText ?? get('route')?.shortText ?? '';
        const city = (get('locality') ?? get('postal_town') ?? get('sublocality') ?? get('administrative_area_level_2'))?.longText ?? '';
        const postalCode = get('postal_code')?.longText ?? '';
        const address = [streetNum, route].filter(Boolean).join(' ') || (j.formattedAddress?.split(',')[0] ?? '');
        return res.status(200).json({ address, city, postalCode });
      } catch {
        return res.status(500).json({ error: 'Lookup failed.' });
      }
    }

    // ── Client videos (metadata + fresh signed view URLs) ──
    if (req.query['_resource'] === 'client_videos') {
      const clientId = String(req.query['clientId'] ?? '');
      if (!clientId) return res.status(400).json({ error: 'Missing clientId.' });
      if (!isR2Configured()) return res.status(200).json([]);
      try {
        const rows = (await prisma.$queryRawUnsafe(
          'SELECT id, "clientId", key, label, "fileName", "contentType", "sizeBytes", "uploadedByUserId", "createdAt" FROM "ClientVideo" WHERE "clientId" = $1 ORDER BY "createdAt" DESC',
          clientId,
        )) as VideoRow[];
        return res.status(200).json(rows.map(serializeVideo));
      } catch {
        await prisma.$executeRawUnsafe(CREATE_CLIENT_VIDEO_TABLE);
        return res.status(200).json([]);
      }
    }

    // ── Trash bin — soft-deleted clients ──
    if (req.query['_resource'] === 'trash_clients') {
      try {
        const trashed = await prisma.client.findMany({
          where: { deletedAt: { not: null } },
          orderBy: { deletedAt: 'desc' },
        });
        return res.status(200).json(trashed);
      } catch {
        await prisma.$executeRawUnsafe('ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3)');
        const trashed = await prisma.client.findMany({
          where: { deletedAt: { not: null } },
          orderBy: { deletedAt: 'desc' },
        });
        return res.status(200).json(trashed);
      }
    }

    // ── Days off list ──
    if (req.query['_resource'] === 'days_off') {
      const daysOff = await withSchema(() => prisma.repDayOff.findMany({ orderBy: { date: 'asc' } }));
      return res.status(200).json(daysOff);
    }

    // ── Household list ──
    if (req.query['_resource'] === 'households') {
      const households = await withSchema(() => prisma.household.findMany({
        include: { members: { select: { id: true } } },
        orderBy: { name: 'asc' },
      }));
      return res.status(200).json(
        households.map(({ members, ...h }) => ({ ...h, memberIds: members.map((m) => m.id) }))
      );
    }

    // ── Trash bin — soft-deleted consultations ──
    if (req.query['_resource'] === 'trash') {
      const trashed = await withSchema(() =>
        prisma.appointment.findMany({ where: { deletedAt: { not: null } }, orderBy: { deletedAt: 'desc' } })
      );
      return res.status(200).json(trashed);
    }

    // One-time cleanup: custom events inherited the client's city via autofill,
    // which polluted the address and dragged map pins to the wrong city. Clear
    // the city AND the stale geocode on ALL events so each pin re-resolves from
    // its clean address. Persisted via a Setting flag so it runs exactly once
    // (a per-instance flag avoids re-checking on every warm request).
    if (!eventCityBackfillDone) {
      eventCityBackfillDone = true;
      try {
        const flag = await prisma.setting.findUnique({ where: { key: 'event_geo_reset_v2' } }).catch(() => null);
        if (!flag) {
          await prisma.$executeRawUnsafe(
            `UPDATE "Appointment" SET city = '', latitude = NULL, longitude = NULL WHERE "appointmentType" IN ('showroom_visit','supplier_meeting','site_check','custom_event')`,
          );
          await prisma.setting.upsert({
            where: { key: 'event_geo_reset_v2' },
            update: { value: 'done' },
            create: { key: 'event_geo_reset_v2', value: 'done' },
          });
        }
      } catch { eventCityBackfillDone = false; }
    }

    const appointments = await withSchema(() =>
      prisma.appointment.findMany({ where: { deletedAt: null }, orderBy: { appointmentDate: 'desc' } })
    );
    return res.status(200).json(appointments);
  }

  if (req.method === 'POST') {
    const data = req.body;

    // ── Geocode appointments for the map view (cached to DB) ──
    if (data._action === 'geocode_appointments') {
      const ids: string[] = Array.isArray(data.ids) ? data.ids.slice(0, 10) : [];
      if (ids.length === 0) return res.status(200).json({ results: [] });

      let rows;
      try {
        rows = await prisma.appointment.findMany({
          where: { id: { in: ids } },
          select: { id: true, address: true, city: true, postalCode: true, latitude: true, longitude: true, appointmentType: true },
        });
      } catch {
        await prisma.$executeRawUnsafe(
          'ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION, ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION'
        );
        rows = await prisma.appointment.findMany({
          where: { id: { in: ids } },
          select: { id: true, address: true, city: true, postalCode: true, latitude: true, longitude: true, appointmentType: true },
        });
      }
      const GEO_EVENT_TYPES = ['showroom_visit', 'supplier_meeting', 'site_check', 'custom_event'];

      const results: Array<{ id: string; latitude: number | null; longitude: number | null }> = [];
      const startTime = Date.now();
      const TIME_BUDGET = 8500; // leave headroom under the function timeout
      const geocodeOne = async (q: string) => {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
        const resp = await fetch(url, {
          headers: { 'User-Agent': 'OntarioReno-Portal/1.0 (info@ontarioreno.ca)' },
        });
        const json = (await resp.json()) as Array<{ lat: string; lon: string }>;
        const hit = json[0];
        return hit ? { lat: parseFloat(hit.lat), lon: parseFloat(hit.lon) } : null;
      };

      for (const row of rows) {
        // Already cached → return as-is
        if (row.latitude != null && row.longitude != null) {
          results.push({ id: row.id, latitude: row.latitude, longitude: row.longitude });
          continue;
        }
        // Out of time — leave for the next pass (client retries).
        if (Date.now() - startTime > TIME_BUDGET) {
          results.push({ id: row.id, latitude: null, longitude: null });
          continue;
        }
        const addr = (row.address ?? '').trim();
        // Events' address is a full freeform location (e.g. a showroom in another
        // city) — geocode by address only so a stale client city can't drag the
        // pin. Consultations may use a city-level fallback for messy addresses.
        const isEvent = GEO_EVENT_TYPES.includes(row.appointmentType);
        const city = isEvent ? '' : (row.city ?? '').trim();
        const queries = [
          [addr, city, 'Ontario, Canada'].filter(Boolean).join(', '),
          !isEvent && city ? `${city}, Ontario, Canada` : '',
        ].filter((q, i, arr) => q && q !== 'Ontario, Canada' && arr.indexOf(q) === i);

        let found: { lat: number; lon: number } | null = null;
        for (const q of queries) {
          if (Date.now() - startTime > TIME_BUDGET) break;
          try {
            found = await geocodeOne(q);
          } catch {
            found = null;
          }
          await new Promise((r) => setTimeout(r, 1000)); // Nominatim ≤ 1 req/sec
          if (found) break;
        }
        if (found) {
          await prisma.appointment.update({ where: { id: row.id }, data: { latitude: found.lat, longitude: found.lon } });
          results.push({ id: row.id, latitude: found.lat, longitude: found.lon });
        } else {
          results.push({ id: row.id, latitude: null, longitude: null });
        }
      }
      return res.status(200).json({ results });
    }

    // ── Client video: step 1, hand the browser a presigned upload URL ──
    if (data._action === 'client_video_presign') {
      if (!isR2Configured()) return res.status(503).json({ error: 'Video storage is not configured.' });
      const clientId = String(data.clientId ?? '');
      const contentType = String(data.contentType ?? '');
      const sizeBytes = Number(data.sizeBytes ?? 0);
      const fileName = String(data.fileName ?? 'video');
      if (!clientId) return res.status(400).json({ error: 'Missing clientId.' });
      if (!contentType.startsWith('video/') && !contentType.startsWith('image/')) {
        return res.status(400).json({ error: 'Only image or video files are allowed.' });
      }
      if (sizeBytes <= 0 || sizeBytes > MAX_VIDEO_BYTES) {
        return res.status(400).json({ error: `File must be between 0 and ${Math.round(MAX_VIDEO_BYTES / 1024 / 1024)} MB.` });
      }
      const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-60);
      const rand = Math.random().toString(36).slice(2, 10);
      const key = `clients/${clientId}/${Date.now()}-${rand}-${safeName}`;
      return res.status(200).json({ uploadUrl: presignPutUrl(key), key });
    }

    // ── Client video: step 2, save metadata once the upload succeeds ──
    if (data._action === 'client_video_save') {
      if (!isR2Configured()) return res.status(503).json({ error: 'Video storage is not configured.' });
      const clientId = String(data.clientId ?? '');
      const key = String(data.key ?? '');
      if (!clientId || !key) return res.status(400).json({ error: 'Missing clientId or key.' });
      const row = {
        id: randomUUID(),
        clientId,
        key,
        label: String(data.label ?? 'Before').slice(0, 60),
        fileName: String(data.fileName ?? '').slice(0, 200),
        contentType: String(data.contentType ?? 'video/mp4').slice(0, 100),
        sizeBytes: Math.max(0, Math.round(Number(data.sizeBytes ?? 0))),
        uploadedByUserId: user.id,
      };
      const insert = () =>
        prisma.$executeRawUnsafe(
          'INSERT INTO "ClientVideo" (id, "clientId", key, label, "fileName", "contentType", "sizeBytes", "uploadedByUserId", "createdAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8, CURRENT_TIMESTAMP)',
          row.id, row.clientId, row.key, row.label, row.fileName, row.contentType, row.sizeBytes, row.uploadedByUserId,
        );
      try {
        await insert();
      } catch {
        await prisma.$executeRawUnsafe(CREATE_CLIENT_VIDEO_TABLE);
        await insert();
      }
      return res.status(201).json({
        id: row.id,
        clientId: row.clientId,
        label: row.label,
        fileName: row.fileName,
        contentType: row.contentType,
        sizeBytes: row.sizeBytes,
        uploadedByUserId: row.uploadedByUserId,
        createdAt: new Date().toISOString(),
        url: presignGetUrl(row.key),
      });
    }

    // ── Client video: delete (admin or the uploader) ──
    if (data._action === 'client_video_delete') {
      const id = String(data.id ?? '');
      if (!id) return res.status(400).json({ error: 'Missing id.' });
      const rows = (await prisma.$queryRawUnsafe(
        'SELECT id, key, "uploadedByUserId" FROM "ClientVideo" WHERE id = $1',
        id,
      )) as { id: string; key: string; uploadedByUserId: string | null }[];
      const video = rows[0];
      if (!video) return res.status(404).json({ error: 'Not found.' });
      if (user.role !== 'admin' && video.uploadedByUserId !== user.id) {
        return res.status(403).json({ error: 'You can only delete videos you uploaded.' });
      }
      try { await deleteObject(video.key); } catch { /* bytes may already be gone */ }
      await prisma.$executeRawUnsafe('DELETE FROM "ClientVideo" WHERE id = $1', id);
      return res.status(200).json({ ok: true });
    }

    // ── Client media: edit the tag/label (admin or the uploader) ──
    if (data._action === 'client_video_update') {
      const id = String(data.id ?? '');
      const label = String(data.label ?? '').slice(0, 60).trim();
      if (!id || !label) return res.status(400).json({ error: 'Missing id or label.' });
      const rows = (await prisma.$queryRawUnsafe(
        'SELECT "uploadedByUserId" FROM "ClientVideo" WHERE id = $1',
        id,
      )) as { uploadedByUserId: string | null }[];
      const existing = rows[0];
      if (!existing) return res.status(404).json({ error: 'Not found.' });
      if (user.role !== 'admin' && existing.uploadedByUserId !== user.id) {
        return res.status(403).json({ error: 'You can only edit videos you uploaded.' });
      }
      await prisma.$executeRawUnsafe('UPDATE "ClientVideo" SET label = $1 WHERE id = $2', label, id);
      return res.status(200).json({ ok: true, label });
    }

    // ── Client media: email a shareable 7-day link to someone ──
    if (data._action === 'client_media_send') {
      const id = String(data.id ?? '');
      const to = String(data.to ?? '').trim();
      const note = String(data.note ?? '').slice(0, 1000);
      if (!id) return res.status(400).json({ error: 'Missing id.' });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return res.status(400).json({ error: 'Invalid recipient email.' });
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) return res.status(500).json({ error: 'Email service is not configured.' });
      const rows = (await prisma.$queryRawUnsafe(
        'SELECT key, label, "fileName", "contentType" FROM "ClientVideo" WHERE id = $1',
        id,
      )) as { key: string; label: string; fileName: string; contentType: string }[];
      const media = rows[0];
      if (!media) return res.status(404).json({ error: 'Not found.' });
      const kind = media.contentType.startsWith('image/') ? 'photo' : 'video';
      const link = presignGetUrl(media.key, 7 * 24 * 3600); // 7-day shareable link
      const subject = `OntarioReno — ${media.label} ${kind}`;
      const senderName = user.name || 'OntarioReno';
      const text = [
        'Hi,',
        '',
        note.trim() ? note.trim() : `Please find the ${media.label.toLowerCase()} ${kind} below.`,
        '',
        `View / download (${media.label} ${kind}):`,
        link,
        '',
        'This link is valid for 7 days.',
        '',
        `Sent by ${senderName} via OntarioReno`,
      ].join('\n');
      try {
        const resend = new Resend(apiKey);
        const { error } = await resend.emails.send({
          from: process.env.EMAIL_FROM ?? 'OntarioReno <info@ontarioreno.ca>',
          to,
          replyTo: user.email || undefined,
          subject,
          text,
        });
        if (error) return res.status(502).json({ error: error.message ?? 'Failed to send.' });
      } catch {
        return res.status(500).json({ error: 'Failed to send the email.' });
      }
      return res.status(200).json({ ok: true });
    }

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

      // ── Notes sync: propagate a client note edit to linked consultations
      // (by clientId or matching email) and their deals (by email). ──
      if (data.internalNotes !== undefined) {
        const notes = String(data.internalNotes ?? '');
        try {
          await prisma.appointment.updateMany({
            where: {
              OR: [
                { clientId: client.id },
                ...(client.email?.trim() ? [{ email: client.email.trim() }] : []),
              ],
            },
            data: { internalNotes: notes, notes },
          });
          if (client.email?.trim()) {
            await prisma.deal.updateMany({
              where: { email: client.email.trim() },
              data: { notes },
            });
          }
        } catch {
          // notes sync is non-critical
        }
      }
      return res.status(200).json(client);
    }

    if (data._action === 'delete_client') {
      if (!data.id) return res.status(400).json({ error: 'Missing id.' });
      if (data.purge === true) {
        await prisma.client.delete({ where: { id: data.id } });
        return res.status(200).json({ ok: true, purged: true });
      }
      try {
        await prisma.client.update({ where: { id: data.id }, data: { deletedAt: new Date() } });
      } catch {
        await prisma.$executeRawUnsafe('ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3)');
        await prisma.client.update({ where: { id: data.id }, data: { deletedAt: new Date() } });
      }
      return res.status(200).json({ ok: true, trashed: true });
    }

    if (data._action === 'restore_client') {
      if (!data.id) return res.status(400).json({ error: 'Missing id.' });
      const client = await prisma.client.update({ where: { id: data.id }, data: { deletedAt: null } });
      return res.status(200).json(client);
    }

    // ── Days off CRUD actions ──
    if (data._action === 'add_days_off') {
      // dates: string[]  (YYYY-MM-DD), targetUserId optional (admin only)
      const dates: string[] = Array.isArray(data.dates) ? data.dates : [];
      if (dates.length === 0) return res.status(400).json({ error: 'No dates provided.' });
      const targetUserId: string = (user.role === 'admin' && data.targetUserId) ? data.targetUserId : user.id;
      const note: string = (data.note as string | undefined)?.trim() ?? '';
      // upsert each date — skip duplicates
      const created = await Promise.all(
        dates.map((date) =>
          prisma.repDayOff.upsert({
            where: { userId_date: { userId: targetUserId, date } },
            update: { note },
            create: { userId: targetUserId, date, note },
          })
        )
      );
      return res.status(201).json(created);
    }

    if (data._action === 'remove_day_off') {
      if (!data.id) return res.status(400).json({ error: 'Missing id.' });
      const dayOff = await prisma.repDayOff.findUnique({ where: { id: data.id } });
      if (!dayOff) return res.status(404).json({ error: 'Not found.' });
      // Only the owning rep or an admin can remove
      if (user.role !== 'admin' && dayOff.userId !== user.id) {
        return res.status(403).json({ error: 'Forbidden.' });
      }
      await prisma.repDayOff.delete({ where: { id: data.id } });
      return res.status(200).json({ ok: true });
    }

    // ── Household CRUD actions ──
    if (data._action === 'create_household') {
      if (!data.name?.trim()) return res.status(400).json({ error: 'Household name is required.' });
      const memberIds: string[] = Array.isArray(data.memberIds) ? data.memberIds : [];
      const household = await prisma.household.create({
        data: {
          name: (data.name as string).trim(),
          notes: (data.notes as string | undefined)?.trim() ?? '',
          ...(memberIds.length ? { members: { connect: memberIds.map((id: string) => ({ id })) } } : {}),
        },
        include: { members: { select: { id: true } } },
      });
      return res.status(201).json({ ...household, memberIds: household.members.map((m) => m.id), members: undefined });
    }

    if (data._action === 'update_household') {
      if (!data.id) return res.status(400).json({ error: 'Missing id.' });
      const household = await prisma.household.update({
        where: { id: data.id },
        data: {
          ...(data.name !== undefined ? { name: (data.name as string).trim() } : {}),
          ...(data.notes !== undefined ? { notes: (data.notes as string).trim() } : {}),
          ...(data.addMemberId ? { members: { connect: { id: data.addMemberId } } } : {}),
          ...(data.removeMemberId ? { members: { disconnect: { id: data.removeMemberId } } } : {}),
          updatedAt: new Date(),
        },
        include: { members: { select: { id: true } } },
      });
      return res.status(200).json({ ...household, memberIds: household.members.map((m) => m.id), members: undefined });
    }

    if (data._action === 'delete_household') {
      if (!data.id) return res.status(400).json({ error: 'Missing id.' });
      await prisma.client.updateMany({ where: { householdId: data.id }, data: { householdId: null } });
      await prisma.household.delete({ where: { id: data.id } });
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

    const appointmentData = {
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
        leadId: data.leadId || null,
        createdByUserId: user.id,
    };
    let appointment;
    try {
      appointment = await prisma.appointment.create({ data: appointmentData });
    } catch {
      // Self-healing: the leadId column may not exist yet on older databases.
      await prisma.$executeRawUnsafe('ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "leadId" TEXT');
      appointment = await prisma.appointment.create({ data: appointmentData });
    }
    // ── Auto-upsert client profile ──
    // Match by email if provided, otherwise create a new profile.
    // Link the appointment back to the client.
    //
    // IMPORTANT: skip this entirely for events (showroom visit, supplier
    // meeting, site check, custom event). An event's address is the event
    // location, not the invited client's home — syncing it would overwrite
    // the client's real address/name on file.
    const EVENT_APPOINTMENT_TYPES = ['showroom_visit', 'supplier_meeting', 'site_check', 'custom_event'];
    const isEventAppointment = EVENT_APPOINTMENT_TYPES.includes(appointment.appointmentType);
    try {
      if (!isEventAppointment) {
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
      }
    } catch {
      // Client auto-linking is non-critical
    }

    // ── Lead promotion: if this consultation was booked from a Lead, link them
    // and flip the lead to 'booked'. Done server-side so the link is reliable
    // even though the client creates appointments optimistically. ──
    if (appointmentData.leadId) {
      try {
        const linked = await prisma.appointment.findUnique({
          where: { id: appointment.id },
          select: { clientId: true },
        });
        await prisma.lead.update({
          where: { id: appointmentData.leadId },
          data: {
            appointmentId: appointment.id,
            status: 'booked',
            ...(linked?.clientId ? { clientId: linked.clientId } : {}),
          },
        });
        await prisma.interaction.create({
          data: {
            leadId: appointmentData.leadId,
            userId: user.id,
            channel: 'system',
            direction: 'internal',
            body: `Appointment booked for ${appointment.appointmentDate} at ${appointment.appointmentTime || 'time TBD'}`,
          },
        });
      } catch {
        // Lead linking is non-critical to creating the appointment.
      }
    }

    // Best-effort push + email to assigned rep
    try {
      const rep = await prisma.user.findUnique({ where: { id: appointment.assignedRepId }, select: { name: true, email: true } });

      // Push notification
      const subs = await prisma.pushSubscription.findMany({ where: { userId: appointment.assignedRepId } });
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

      // Email notification
      if (rep?.email) {
        await sendAppointmentNotification({
          event: 'scheduled',
          repName: rep.name,
          repEmail: rep.email,
          customerName: appointment.customerName,
          appointmentDate: appointment.appointmentDate,
          appointmentTime: appointment.appointmentTime,
          address: appointment.address,
          city: appointment.city,
          title: appointment.title,
        });
      }
    } catch {
      // notifications are non-critical
    }

    return res.status(201).json(appointment);
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
