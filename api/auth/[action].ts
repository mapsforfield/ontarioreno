import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';
import { prisma } from '../../lib/prisma.js';
import { withSchema } from '../../lib/schema.js';
import {
  signToken,
  setAuthCookie,
  clearAuthCookie,
  getCurrentUser,
  requireAuth,
  requireAdmin,
} from '../../lib/auth.js';

const EMAIL_FROM = process.env.EMAIL_FROM ?? 'OntarioReno <info@ontarioreno.ca>';
const MAX_FIELD_LENGTH = 2_000;

function extractAddress(from: string): string {
  const match = from.match(/<([^\s@>]+@[^\s@>]+\.[^\s@>]+)>/);
  return match ? match[1] : from.trim();
}
const BUSINESS_INBOX = extractAddress(EMAIL_FROM);

function isValidDate(d: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(Date.parse(d));
}

function fmtDate(d: string): string {
  try {
    return new Date(`${d}T12:00:00`).toLocaleDateString('en-CA', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch { return d; }
}

/**
 * Single handler for all auth + shared utility routes:
 *   POST /api/auth/login            — bcrypt check, set JWT cookie
 *   POST /api/auth/logout           — clear JWT cookie
 *   GET  /api/auth/me               — return current user from JWT cookie
 *   POST /api/auth/add-rep          — admin: create a new rep user
 *   GET  /api/auth/activities       — list recent activities (auth required)
 *   POST /api/auth/activities       — record an activity (auth required)
 *   POST /api/auth/customer-request — public: reschedule/cancel consultation
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = req.query['action'] as string;

  // ── /api/auth/login ──────────────────────────────────────────────────────────
  if (action === 'login') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user || !user.active || !user.passwordHash) return res.status(401).json({ error: 'Invalid email or password.' });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password.' });
    const token = signToken({ userId: user.id, role: user.role });
    setAuthCookie(res, token);
    return res.status(200).json({
      ok: true, id: user.id, name: user.name, email: user.email,
      role: user.role, avatarInitial: user.avatarInitial, avatarUrl: user.avatarUrl, active: user.active,
    });
  }

  // ── /api/auth/logout ─────────────────────────────────────────────────────────
  if (action === 'logout') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
    clearAuthCookie(res);
    return res.status(200).json({ ok: true });
  }

  // ── /api/auth/ably-token ──────────────────────────────────────────────────────
  // Issues a short-lived Ably token so the browser can connect to the realtime
  // "doorbell" channel without ever seeing the root API key. Returns 503 when
  // realtime isn't configured so the client can quietly fall back.
  if (action === 'ably-token') {
    const user = await requireAuth(req, res);
    if (!user) return;
    const apiKey = process.env.ABLY_API_KEY;
    if (!apiKey) return res.status(503).json({ error: 'Realtime not configured.' });
    try {
      const { Rest } = await import('ably');
      const client = new Rest(apiKey);
      const tokenRequest = await client.auth.createTokenRequest({ clientId: user.id });
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json(tokenRequest);
    } catch (err) {
      console.error('[auth] ably-token failed:', err);
      return res.status(500).json({ error: 'Could not issue realtime token.' });
    }
  }

  // ── /api/auth/rep-access ──────────────────────────────────────────────────
  // Admin-managed map of which portal sections reps may access. Any authed user
  // can READ it (so the nav/guards know what to show); only admins can WRITE.
  if (action === 'rep-access') {
    const user = await requireAuth(req, res);
    if (!user) return;

    if (req.method === 'GET') {
      const row = await withSchema(() => prisma.setting.findUnique({ where: { key: 'rep_access' } }));
      let value: Record<string, boolean> = {};
      try { value = row?.value ? JSON.parse(row.value) : {}; } catch { value = {}; }
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json(value);
    }

    if (req.method === 'POST') {
      if (user.role !== 'admin') return res.status(403).json({ error: 'Admin only.' });
      const body = (req.body ?? {}) as Record<string, unknown>;
      const access: Record<string, boolean> = {};
      for (const [k, v] of Object.entries(body)) access[String(k)] = Boolean(v);
      await withSchema(() => prisma.setting.upsert({
        where: { key: 'rep_access' },
        update: { value: JSON.stringify(access) },
        create: { key: 'rep_access', value: JSON.stringify(access) },
      }));
      return res.status(200).json(access);
    }

    return res.status(405).json({ error: 'Method not allowed.' });
  }

  // ── /api/auth/tasks ───────────────────────────────────────────────────────
  // Personal to-do list. Each user only ever sees/edits their own tasks.
  if (action === 'tasks') {
    const user = await requireAuth(req, res);
    if (!user) return;
    const ensureTable = () =>
      prisma.$executeRawUnsafe(
        'CREATE TABLE IF NOT EXISTS "Task" ("id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL, "title" TEXT NOT NULL, "dueAt" TEXT, "done" BOOLEAN NOT NULL DEFAULT false, "reminderSentAt" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)'
      );

    if (req.method === 'GET') {
      const tasks = await withSchema(() =>
        prisma.task.findMany({
          where: { userId: user.id },
          orderBy: [{ done: 'asc' }, { dueAt: 'asc' }, { createdAt: 'desc' }],
        })
      );
      return res.status(200).json(tasks);
    }

    if (req.method === 'POST') {
      const body = req.body as Record<string, unknown>;
      const op = body.op as string;
      const createTask = () =>
        prisma.task.create({
          data: {
            userId: user.id,
            title: String(body.title ?? '').slice(0, 300),
            dueAt: body.dueAt ? String(body.dueAt) : null,
          },
        });
      try {
        if (op === 'create') return res.status(201).json(await createTask());
        if (op === 'update' || op === 'delete') {
          const existing = await prisma.task.findUnique({ where: { id: String(body.id) } });
          if (!existing || existing.userId !== user.id) return res.status(403).json({ error: 'Forbidden.' });
          if (op === 'delete') {
            await prisma.task.delete({ where: { id: existing.id } });
            return res.status(200).json({ ok: true });
          }
          const data: { title?: string; dueAt?: string | null; done?: boolean } = {};
          if (body.title !== undefined) data.title = String(body.title).slice(0, 300);
          if (body.dueAt !== undefined) data.dueAt = body.dueAt ? String(body.dueAt) : null;
          if (body.done !== undefined) data.done = !!body.done;
          return res.status(200).json(await prisma.task.update({ where: { id: existing.id }, data }));
        }
        return res.status(400).json({ error: 'Unknown op.' });
      } catch {
        await ensureTable();
        if (op === 'create') return res.status(201).json(await createTask());
        return res.status(500).json({ error: 'Task operation failed.' });
      }
    }
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  // ── /api/auth/me ─────────────────────────────────────────────────────────────
  if (action === 'me') {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' });
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ error: 'Not authenticated.' });
    return res.status(200).json({
      id: user.id, name: user.name, email: user.email, role: user.role,
      avatarInitial: user.avatarInitial, avatarUrl: user.avatarUrl, active: user.active,
    });
  }

  // ── /api/auth/add-rep ────────────────────────────────────────────────────────
  if (action === 'add-rep') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const { name, email, password, role, avatarInitial, avatarUrl } = req.body as {
      name: string; email: string; password: string;
      role?: string; avatarInitial: string; avatarUrl?: string;
    };
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required.' });
    const passwordHash = await bcrypt.hash(password, 10);
    try {
      const user = await prisma.user.create({
        data: {
          name, email: email.toLowerCase().trim(), passwordHash,
          role: role ?? 'rep',
          avatarInitial: avatarInitial ?? name[0].toUpperCase(),
          avatarUrl: avatarUrl ?? null, active: true,
        },
        select: { id: true, name: true, email: true, role: true, avatarInitial: true, avatarUrl: true, active: true },
      });
      return res.status(201).json(user);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'P2002') return res.status(409).json({ error: 'A user with that email already exists.' });
      throw err;
    }
  }

  // ── /api/auth/activities ─────────────────────────────────────────────────────
  if (action === 'activities') {
    const user = await requireAuth(req, res);
    if (!user) return;

    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'no-store');
      const activities = await withSchema(() =>
        prisma.activity.findMany({ orderBy: { createdAt: 'desc' }, take: 200 })
      );
      return res.status(200).json(activities);
    }

    if (req.method === 'POST') {
      const data = req.body;
      const activity = await prisma.activity.create({
        data: {
          actorUserId: user.id, actorName: user.name, actorRole: user.role,
          actionType: data.actionType, actionLabel: data.actionLabel,
          entityType: data.entityType, entityId: data.entityId, entityLabel: data.entityLabel,
          dealId: data.dealId ?? null, contractorId: data.contractorId ?? null,
          metadata: data.metadata ?? null,
        },
      });
      return res.status(201).json(activity);
    }

    return res.status(405).json({ error: 'Method not allowed.' });
  }

  // ── /api/auth/customer-request ───────────────────────────────────────────────
  if (action === 'customer-request') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Email service is not configured.' });

    const body = req.body as Record<string, unknown>;
    const { type, appointmentId, preferredDate, preferredTime, notes, reason } = body;

    if (type !== 'reschedule' && type !== 'cancel') return res.status(400).json({ error: 'Request type must be "reschedule" or "cancel".' });
    if (typeof appointmentId !== 'string' || !appointmentId.trim()) return res.status(400).json({ error: 'Missing appointment ID.' });
    if (type === 'reschedule') {
      if (typeof preferredDate !== 'string' || !isValidDate(preferredDate)) return res.status(400).json({ error: 'Invalid or missing preferred date.' });
      if (typeof preferredTime !== 'string' || !preferredTime.trim()) return res.status(400).json({ error: 'Missing preferred time.' });
    }
    if (notes !== undefined && (typeof notes !== 'string' || notes.length > MAX_FIELD_LENGTH)) return res.status(400).json({ error: 'Notes field exceeds maximum length.' });
    if (reason !== undefined && (typeof reason !== 'string' || (reason as string).length > MAX_FIELD_LENGTH)) return res.status(400).json({ error: 'Reason field exceeds maximum length.' });

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId.trim() },
      include: { assignedRep: { select: { name: true, email: true } } },
    }).catch(() => null);

    const customerName = appointment?.customerName ?? 'Customer';
    const repName = appointment?.assignedRep?.name ?? null;
    const repEmail = appointment?.assignedRep?.email ?? null;

    if (appointment) {
      const dbUpdate: Record<string, unknown> = {};
      if (type === 'cancel') {
        dbUpdate.status = 'cancelled';
      } else {
        dbUpdate.status = 'rescheduled';
        if (typeof preferredDate === 'string') dbUpdate.appointmentDate = preferredDate;
        if (typeof preferredTime === 'string') dbUpdate.appointmentTime = preferredTime;
      }
      await prisma.appointment.update({ where: { id: appointmentId.trim() }, data: dbUpdate }).catch((err: unknown) => {
        console.error('Failed to update appointment in DB:', err);
      });
    }

    const ref = appointmentId.trim().replace(/-/g, '').slice(-8).toUpperCase();
    let subject: string; let text: string;
    if (type === 'reschedule') {
      subject = `Reschedule Request – ${customerName} – Consultation #${ref}`;
      text = [
        `A customer has submitted a reschedule request for their consultation.`,
        ``, `Customer       : ${customerName}`, `Assigned rep   : ${repName ?? 'Unassigned'}`,
        `Appointment ID : ${appointmentId.trim()}`, `Reference      : #${ref}`,
        `Preferred date : ${fmtDate(typeof preferredDate === 'string' ? preferredDate : '')}`,
        `Preferred time : ${preferredTime}`,
        typeof notes === 'string' && notes ? `Additional notes: ${notes}` : ``,
        ``, `The appointment has been marked as "Rescheduled" in the portal.`,
        `Log in to confirm the new date and time with the customer.`,
      ].filter(Boolean).join('\n');
    } else {
      subject = `Cancellation Request – ${customerName} – Consultation #${ref}`;
      text = [
        `A customer has requested to cancel their consultation.`,
        ``, `Customer       : ${customerName}`, `Assigned rep   : ${repName ?? 'Unassigned'}`,
        `Appointment ID : ${appointmentId.trim()}`, `Reference      : #${ref}`,
        `Reason         : ${typeof reason === 'string' && reason.trim() ? reason.trim() : 'Not provided'}`,
        ``, `The appointment has been marked as "Cancelled" in the portal.`,
        `Contact the customer if follow-up is needed.`,
      ].join('\n');
    }

    const toAddresses = [BUSINESS_INBOX];
    if (repEmail && repEmail.toLowerCase() !== BUSINESS_INBOX.toLowerCase()) toAddresses.push(repEmail);

    try {
      const resend = new Resend(apiKey);
      const { error } = await resend.emails.send({ from: EMAIL_FROM, to: toAddresses, subject, text });
      if (error) return res.status(502).json({ error: error.message ?? 'Failed to send notification.' });
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('Unexpected error in customer-request:', err);
      return res.status(500).json({ error: 'Unexpected error. Please try again.' });
    }
  }

  return res.status(404).json({ error: 'Unknown auth action.' });
}
