import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../lib/prisma.js';
import { requireAuth } from '../../lib/auth.js';

// Single leads function (Vercel Hobby caps deployments at 12 functions, so list /
// single-record / intake are all served here and routed by query param):
//   /api/leads               → list + POST actions (authenticated)
//   /api/leads?id=…          → PATCH / DELETE / restore one lead (authenticated)
//   /api/leads?intake=1      → token-gated, UNAUTHENTICATED external intake (Meta)

// ─── Self-healing schema (DB can't be migrated from local; create on demand) ──
const CREATE_LEAD_TABLE =
  'CREATE TABLE IF NOT EXISTS "Lead" (' +
  '"id" TEXT PRIMARY KEY, "name" TEXT NOT NULL, ' +
  '"phone" TEXT NOT NULL DEFAULT \'\', "email" TEXT NOT NULL DEFAULT \'\', ' +
  '"city" TEXT NOT NULL DEFAULT \'\', "address" TEXT NOT NULL DEFAULT \'\', ' +
  '"postalCode" TEXT NOT NULL DEFAULT \'\', "projectType" TEXT NOT NULL DEFAULT \'\', ' +
  '"budget" TEXT NOT NULL DEFAULT \'\', "financingInterest" BOOLEAN, ' +
  '"source" TEXT NOT NULL DEFAULT \'manual\', "sourceDetail" TEXT NOT NULL DEFAULT \'\', ' +
  '"externalId" TEXT, "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, ' +
  '"status" TEXT NOT NULL DEFAULT \'new\', "assignedRepId" TEXT, ' +
  '"callbackAt" TIMESTAMP(3), "lastContactedAt" TIMESTAMP(3), ' +
  '"attemptCount" INTEGER NOT NULL DEFAULT 0, "notes" TEXT NOT NULL DEFAULT \'\', ' +
  '"clientId" TEXT, "dealId" TEXT, "appointmentId" TEXT, "deletedAt" TIMESTAMP(3), ' +
  '"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, ' +
  '"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)';

const CREATE_INTERACTION_TABLE =
  'CREATE TABLE IF NOT EXISTS "Interaction" (' +
  '"id" TEXT PRIMARY KEY, "leadId" TEXT NOT NULL, "userId" TEXT, ' +
  '"channel" TEXT NOT NULL DEFAULT \'call\', "direction" TEXT NOT NULL DEFAULT \'outbound\', ' +
  '"outcome" TEXT, "subject" TEXT, "body" TEXT NOT NULL DEFAULT \'\', ' +
  '"durationSeconds" INTEGER, "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, ' +
  '"metadata" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, ' +
  'CONSTRAINT "Interaction_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE)';

const LEAD_INDEXES = [
  'CREATE UNIQUE INDEX IF NOT EXISTS "Lead_externalId_key" ON "Lead"("externalId")',
  'CREATE INDEX IF NOT EXISTS "Lead_assignedRepId_status_idx" ON "Lead"("assignedRepId","status")',
  'CREATE INDEX IF NOT EXISTS "Lead_status_idx" ON "Lead"("status")',
  'CREATE INDEX IF NOT EXISTS "Lead_callbackAt_idx" ON "Lead"("callbackAt")',
  'CREATE INDEX IF NOT EXISTS "Lead_deletedAt_idx" ON "Lead"("deletedAt")',
  'CREATE INDEX IF NOT EXISTS "Interaction_leadId_occurredAt_idx" ON "Interaction"("leadId","occurredAt")',
  'CREATE INDEX IF NOT EXISTS "Interaction_channel_idx" ON "Interaction"("channel")',
];

let tablesEnsured = false;
async function ensureLeadTables() {
  await prisma.$executeRawUnsafe(CREATE_LEAD_TABLE);
  await prisma.$executeRawUnsafe(CREATE_INTERACTION_TABLE);
  for (const sql of LEAD_INDEXES) {
    try { await prisma.$executeRawUnsafe(sql); } catch { /* index race — ignore */ }
  }
  tablesEnsured = true;
}

/** Run a query; if it fails because the tables don't exist yet, create + retry. */
async function withTables<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (tablesEnsured) throw err;
    await ensureLeadTables();
    return await fn();
  }
}

const TERMINAL = ['booked', 'qualified', 'won', 'lost', 'dead', 'duplicate'];

const normPhone = (v: unknown) => String(v ?? '').replace(/\D/g, '');
const normEmail = (v: unknown) => String(v ?? '').trim().toLowerCase();

const leadInclude = { interactions: { orderBy: { occurredAt: 'desc' } as const } };

/** Map a call outcome to the lead status it should drive. */
function statusForOutcome(outcome: string): string | null {
  switch (outcome) {
    case 'not_interested':
    case 'not_qualified':
      return 'lost';
    case 'wrong_number':
      return 'dead';
    case 'duplicate':
      return 'duplicate';
    case 'already_booked':
    case 'booked':
      return 'booked';
    case 'callback_scheduled':
      return 'callback_scheduled';
    case 'no_answer':
    case 'voicemail':
    case 'needs_follow_up':
      return 'attempting';
    default:
      return null;
  }
}

// ─── ?intake=1 — token-gated, UNAUTHENTICATED ─────────────────────────────────
async function handleIntake(req: VercelRequest, res: VercelResponse) {
  const secret = process.env.LEAD_INTAKE_TOKEN;

  // Meta webhook verification handshake.
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const verifyToken = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && secret && verifyToken === secret) {
      return res.status(200).send(String(challenge ?? ''));
    }
    return res.status(403).json({ error: 'Verification failed.' });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  const provided =
    (req.headers['x-intake-token'] as string | undefined) ??
    (req.query['token'] as string | undefined);
  if (!secret || provided !== secret) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const data = (req.body ?? {}) as Record<string, unknown>;
  const name = String(data.name ?? '').trim();
  if (!name) return res.status(400).json({ error: 'Name is required.' });

  const phone = String(data.phone ?? '').trim();
  const email = String(data.email ?? '').trim();
  const externalId = data.externalId ? String(data.externalId) : null;

  try {
    return await withTables(async () => {
      // Dedupe — always 200 so the sender (Meta) does not retry-storm.
      const dupe = await prisma.lead.findFirst({
        where: {
          OR: [
            ...(externalId ? [{ externalId }] : []),
            ...(normPhone(phone) ? [{ phone }] : []),
            ...(normEmail(email) ? [{ email }] : []),
          ],
        },
        select: { id: true },
      });
      if (dupe) return res.status(200).json({ ok: true, deduped: true, id: dupe.id });

      const lead = await prisma.lead.create({
        data: {
          name,
          phone,
          email,
          city: String(data.city ?? '').trim(),
          address: String(data.address ?? '').trim(),
          postalCode: String(data.postalCode ?? '').trim(),
          projectType: String(data.projectType ?? '').trim(),
          budget: String(data.budget ?? '').trim(),
          financingInterest:
            typeof data.financingInterest === 'boolean' ? data.financingInterest : null,
          source: 'meta',
          sourceDetail: String(data.sourceDetail ?? '').trim(),
          externalId,
          notes: String(data.notes ?? '').trim(),
          assignedRepId: null,
        },
        select: { id: true },
      });
      return res.status(201).json({ ok: true, id: lead.id });
    });
  } catch (err) {
    console.error('[leads/intake] failed:', err);
    return res.status(200).json({ ok: false }); // avoid external retry storms
  }
}

// ─── ?id=… — PATCH / DELETE / restore (authenticated) ─────────────────────────
const EDITABLE = new Set([
  'name', 'phone', 'email', 'city', 'address', 'postalCode', 'projectType',
  'budget', 'financingInterest', 'status', 'callbackAt', 'notes',
  'clientId', 'dealId', 'appointmentId', 'sourceDetail',
]);

async function handleById(
  req: VercelRequest,
  res: VercelResponse,
  user: { id: string; role: string },
  id: string,
) {
  const loadOwned = async () => {
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) { res.status(404).json({ error: 'Lead not found.' }); return null; }
    if (user.role !== 'admin' && lead.assignedRepId !== user.id) {
      res.status(403).json({ error: 'This lead is not assigned to you.' });
      return null;
    }
    return lead;
  };

  if (req.method === 'PUT' || req.method === 'PATCH') {
    const body = (req.body ?? {}) as Record<string, unknown>;
    return await withTables(async () => {
      const lead = await loadOwned();
      if (!lead) return;
      const patch: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(body)) {
        if (EDITABLE.has(key)) patch[key] = value;
      }
      if (user.role === 'admin' && 'assignedRepId' in body) {
        patch.assignedRepId = body.assignedRepId ? String(body.assignedRepId) : null;
      }
      if ('callbackAt' in patch) {
        patch.callbackAt = patch.callbackAt ? new Date(String(patch.callbackAt)) : null;
      }
      const updated = await prisma.lead.update({ where: { id }, data: patch, include: leadInclude });
      return res.status(200).json(updated);
    });
  }

  if (req.method === 'POST') {
    const body = (req.body ?? {}) as Record<string, unknown>;
    if (body._action === 'restore_lead') {
      return await withTables(async () => {
        const lead = await loadOwned();
        if (!lead) return;
        const restored = await prisma.lead.update({
          where: { id }, data: { deletedAt: null }, include: leadInclude,
        });
        return res.status(200).json(restored);
      });
    }
    return res.status(400).json({ error: 'Unknown _action.' });
  }

  if (req.method === 'DELETE') {
    return await withTables(async () => {
      const lead = await loadOwned();
      if (!lead) return;
      if (req.query['purge'] === '1') {
        await prisma.lead.delete({ where: { id } }); // interactions cascade
        return res.status(200).json({ ok: true, purged: true });
      }
      await prisma.lead.update({ where: { id }, data: { deletedAt: new Date() } });
      return res.status(200).json({ ok: true, trashed: true });
    });
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}

// ─── /api/leads — list + POST actions (authenticated) ─────────────────────────
async function handleCollection(
  req: VercelRequest,
  res: VercelResponse,
  user: { id: string; role: string },
) {
  if (req.method === 'GET') {
    if (req.query['_resource'] === 'unassigned') {
      if (user.role !== 'admin') return res.status(403).json({ error: 'Admin only.' });
      const leads = await withTables(() =>
        prisma.lead.findMany({
          where: { assignedRepId: null, deletedAt: null, status: { notIn: TERMINAL } },
          orderBy: { submittedAt: 'desc' },
          include: leadInclude,
        })
      );
      return res.status(200).json(leads);
    }

    if (req.query['_resource'] === 'trash') {
      const where = {
        deletedAt: { not: null },
        ...(user.role === 'admin' ? {} : { assignedRepId: user.id }),
      };
      const leads = await withTables(() =>
        prisma.lead.findMany({ where, orderBy: { deletedAt: 'desc' }, include: leadInclude })
      );
      return res.status(200).json(leads);
    }

    const where = {
      deletedAt: null,
      ...(user.role === 'admin' ? {} : { assignedRepId: user.id }),
    };
    const leads = await withTables(() =>
      prisma.lead.findMany({ where, orderBy: { createdAt: 'desc' }, include: leadInclude })
    );
    return res.status(200).json(leads);
  }

  if (req.method === 'POST') {
    const data = (req.body ?? {}) as Record<string, unknown>;
    const action = data._action as string | undefined;

    if (action === 'import_leads') {
      if (user.role !== 'admin') return res.status(403).json({ error: 'Admin only.' });
      const rows = Array.isArray(data.rows) ? (data.rows as Record<string, unknown>[]) : [];
      if (rows.length === 0) return res.status(400).json({ error: 'No rows provided.' });

      return await withTables(async () => {
        const existing = await prisma.lead.findMany({
          select: { phone: true, email: true, externalId: true },
        });
        const seenPhones = new Set(existing.map((l) => normPhone(l.phone)).filter(Boolean));
        const seenEmails = new Set(existing.map((l) => normEmail(l.email)).filter(Boolean));
        const seenExternal = new Set(existing.map((l) => l.externalId).filter(Boolean) as string[]);

        const toCreate: Array<Record<string, unknown>> = [];
        let duplicates = 0;
        for (const row of rows) {
          const name = String(row.name ?? '').trim();
          if (!name) continue; // unnamed rows fall into "skipped"
          const phone = normPhone(row.phone);
          const email = normEmail(row.email);
          const externalId = row.externalId ? String(row.externalId) : null;
          const isDup =
            (externalId && seenExternal.has(externalId)) ||
            (phone && seenPhones.has(phone)) ||
            (email && seenEmails.has(email));
          if (isDup) { duplicates++; continue; }
          if (phone) seenPhones.add(phone);
          if (email) seenEmails.add(email);
          if (externalId) seenExternal.add(externalId);

          let financingInterest: boolean | null = null;
          if (typeof row.financingInterest === 'boolean') financingInterest = row.financingInterest;
          else if (typeof row.financingInterest === 'string') {
            const f = row.financingInterest.trim().toLowerCase();
            if (['yes', 'true', 'y', '1'].includes(f)) financingInterest = true;
            else if (['no', 'false', 'n', '0'].includes(f)) financingInterest = false;
          }

          toCreate.push({
            name,
            phone: String(row.phone ?? '').trim(),
            email: String(row.email ?? '').trim(),
            city: String(row.city ?? '').trim(),
            address: String(row.address ?? '').trim(),
            postalCode: String(row.postalCode ?? '').trim(),
            projectType: String(row.projectType ?? '').trim(),
            budget: String(row.budget ?? '').trim(),
            financingInterest,
            source: String(row.source ?? 'import'),
            sourceDetail: String(row.sourceDetail ?? '').trim(),
            externalId,
            submittedAt: row.submittedAt ? new Date(String(row.submittedAt)) : new Date(),
            notes: String(row.notes ?? '').trim(),
            assignedRepId: null,
          });
        }

        let created = 0;
        if (toCreate.length > 0) {
          const result = await prisma.lead.createMany({ data: toCreate as never, skipDuplicates: true });
          created = result.count;
        }
        return res.status(201).json({ created, duplicates, skipped: rows.length - created - duplicates });
      });
    }

    if (action === 'assign') {
      if (user.role !== 'admin') return res.status(403).json({ error: 'Admin only.' });
      const ids = Array.isArray(data.ids) ? (data.ids as string[]) : [];
      const repId = data.repId ? String(data.repId) : null;
      if (ids.length === 0) return res.status(400).json({ error: 'No lead ids provided.' });
      if (repId) {
        const rep = await prisma.user.findUnique({ where: { id: repId } });
        if (!rep) return res.status(404).json({ error: 'Rep not found.' });
      }
      await withTables(() =>
        prisma.lead.updateMany({ where: { id: { in: ids } }, data: { assignedRepId: repId } })
      );
      return res.status(200).json({ ok: true, ids, repId });
    }

    if (action === 'log_interaction') {
      const leadId = String(data.leadId ?? '');
      if (!leadId) return res.status(400).json({ error: 'Missing leadId.' });
      return await withTables(async () => {
        const lead = await prisma.lead.findUnique({ where: { id: leadId } });
        if (!lead) return res.status(404).json({ error: 'Lead not found.' });
        if (user.role !== 'admin' && lead.assignedRepId !== user.id) {
          return res.status(403).json({ error: 'This lead is not assigned to you.' });
        }

        const channel = String(data.channel ?? 'call');
        const outcome = data.outcome ? String(data.outcome) : null;
        const interaction = await prisma.interaction.create({
          data: {
            leadId,
            userId: user.id,
            channel,
            direction: String(data.direction ?? 'outbound'),
            outcome,
            subject: data.subject ? String(data.subject) : null,
            body: String(data.body ?? ''),
            durationSeconds: data.durationSeconds != null ? Math.round(Number(data.durationSeconds)) : null,
            occurredAt: data.occurredAt ? new Date(String(data.occurredAt)) : new Date(),
          },
        });

        const leadUpdate: Record<string, unknown> = {};
        if (channel === 'call') {
          leadUpdate.attemptCount = lead.attemptCount + 1;
          leadUpdate.lastContactedAt = new Date();
        }
        if (outcome) {
          const nextStatus = statusForOutcome(outcome);
          if (nextStatus && !['booked', 'qualified'].includes(lead.status)) {
            leadUpdate.status = nextStatus;
          }
          if (outcome === 'callback_scheduled' && data.callbackAt) {
            leadUpdate.callbackAt = new Date(String(data.callbackAt));
          }
        }
        const updatedLead = Object.keys(leadUpdate).length
          ? await prisma.lead.update({ where: { id: leadId }, data: leadUpdate, include: leadInclude })
          : await prisma.lead.findUnique({ where: { id: leadId }, include: leadInclude });

        return res.status(201).json({ interaction, lead: updatedLead });
      });
    }

    if (action === 'schedule_callback') {
      const leadId = String(data.leadId ?? '');
      const callbackAt = data.callbackAt ? new Date(String(data.callbackAt)) : null;
      if (!leadId || !callbackAt) return res.status(400).json({ error: 'Missing leadId or callbackAt.' });
      return await withTables(async () => {
        const lead = await prisma.lead.findUnique({ where: { id: leadId } });
        if (!lead) return res.status(404).json({ error: 'Lead not found.' });
        if (user.role !== 'admin' && lead.assignedRepId !== user.id) {
          return res.status(403).json({ error: 'This lead is not assigned to you.' });
        }
        const note = String(data.note ?? '').trim();
        const interaction = await prisma.interaction.create({
          data: {
            leadId,
            userId: user.id,
            channel: 'system',
            direction: 'internal',
            body: note || `Callback scheduled for ${callbackAt.toISOString()}`,
          },
        });
        const updatedLead = await prisma.lead.update({
          where: { id: leadId },
          data: { callbackAt, status: 'callback_scheduled' },
          include: leadInclude,
        });
        return res.status(200).json({ lead: updatedLead, interaction });
      });
    }

    // Create a single lead. Reps create self-assigned; admins create unassigned.
    return await withTables(async () => {
      const name = String(data.name ?? '').trim();
      if (!name) return res.status(400).json({ error: 'Name is required.' });
      const assignedRepId =
        user.role === 'rep' ? user.id : data.assignedRepId ? String(data.assignedRepId) : null;
      const lead = await prisma.lead.create({
        data: {
          name,
          phone: String(data.phone ?? '').trim(),
          email: String(data.email ?? '').trim(),
          city: String(data.city ?? '').trim(),
          address: String(data.address ?? '').trim(),
          postalCode: String(data.postalCode ?? '').trim(),
          projectType: String(data.projectType ?? '').trim(),
          budget: String(data.budget ?? '').trim(),
          financingInterest: typeof data.financingInterest === 'boolean' ? data.financingInterest : null,
          source: String(data.source ?? 'manual'),
          sourceDetail: String(data.sourceDetail ?? '').trim(),
          notes: String(data.notes ?? '').trim(),
          assignedRepId,
        },
        include: leadInclude,
      });
      return res.status(201).json(lead);
    });
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}

// ─── Router (by query param — robust on Vercel, no catch-all) ─────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Intake is unauthenticated (token-gated) — handle before requireAuth.
  if (req.query['intake'] !== undefined) {
    return handleIntake(req, res);
  }

  const user = await requireAuth(req, res);
  if (!user) return;

  const id = req.query['id'] as string | undefined;
  if (id) return handleById(req, res, user, id);
  return handleCollection(req, res, user);
}
