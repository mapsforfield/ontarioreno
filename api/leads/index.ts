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
const clean = (v: unknown) => String(v ?? '').trim();

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

function sourceRank(source: unknown) {
  const s = clean(source).toLowerCase();
  if (['website_intake', 'website', 'intake', 'parsed'].includes(s)) return 3;
  if (s === 'meta') return 2;
  if (s === 'import') return 1;
  return 0;
}

function isWebsiteSource(source: unknown) {
  return sourceRank(source) >= 3;
}

function statusForImportStatus(value: unknown): { status: string; note: string } {
  const s = clean(value).toLowerCase().replace(/[\s-]+/g, '_');
  switch (s) {
    case '':
    case 'new':
      return { status: 'new', note: '' };
    case 'not_interested':
    case 'notinterested':
      return { status: 'lost', note: 'Import status: not_interested' };
    case 'duplicate':
      return { status: 'duplicate', note: 'Import status: duplicate' };
    case 'booked':
      return { status: 'booked', note: 'Import status: booked' };
    case 'callback':
    case 'callback_scheduled':
      return { status: 'new', note: 'Import status: callback' };
    default:
      return { status: 'new', note: `Import status: ${clean(value)}` };
  }
}

function parseFinancingInterest(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  const f = clean(value).toLowerCase();
  if (['yes', 'true', 'y', '1', 'interested', 'needed'].includes(f)) return true;
  if (['no', 'false', 'n', '0', 'not interested', 'none'].includes(f)) return false;
  return null;
}

function formatExtraAnswers(extra: unknown) {
  if (!extra || typeof extra !== 'object' || Array.isArray(extra)) return '';
  const entries = Object.entries(extra as Record<string, unknown>)
    .map(([key, value]) => [clean(key), clean(value)])
    .filter(([key, value]) => key && value);
  if (entries.length === 0) return '';
  return ['Website intake answers', ...entries.map(([key, value]) => `${key}: ${value}`)].join('\n');
}

function mergeNotes(...parts: Array<string | null | undefined>) {
  const out: string[] = [];
  for (const part of parts) {
    const text = clean(part);
    if (text && !out.some((existing) => existing.includes(text) || text.includes(existing))) out.push(text);
  }
  return out.join('\n\n');
}

function importLeadData(row: Record<string, unknown>) {
  const importSource = clean(row.importSource);
  const explicitSource = clean(row.source);
  const source = explicitSource || (importSource === 'website_intake' ? 'website_intake' : importSource === 'meta' ? 'meta' : 'import');
  const statusInfo = statusForImportStatus(row.importStatus);
  const extraNotes = formatExtraAnswers(row.extraAnswers);
  const notes = mergeNotes(clean(row.notes), statusInfo.note, extraNotes);
  return {
    name: clean(row.name),
    phone: clean(row.phone),
    email: clean(row.email),
    city: clean(row.city),
    address: clean(row.address),
    postalCode: clean(row.postalCode),
    projectType: clean(row.projectType),
    budget: clean(row.budget),
    financingInterest: parseFinancingInterest(row.financingInterest),
    source,
    sourceDetail: clean(row.sourceDetail),
    externalId: row.externalId ? clean(row.externalId) : null,
    submittedAt: row.submittedAt ? new Date(String(row.submittedAt)) : new Date(),
    status: statusInfo.status,
    notes,
  };
}

function hasValue(value: unknown) {
  return value !== null && value !== undefined && String(value).trim() !== '';
}

function mergeLeadPatch(existing: Record<string, unknown>, incoming: ReturnType<typeof importLeadData>) {
  const incomingRicher = isWebsiteSource(incoming.source) || sourceRank(incoming.source) > sourceRank(existing.source);
  const patch: Record<string, unknown> = {};
  for (const field of ['name', 'phone', 'email', 'city', 'address', 'postalCode', 'projectType', 'budget', 'sourceDetail'] as const) {
    if (hasValue(incoming[field]) && (!hasValue(existing[field]) || incomingRicher)) patch[field] = incoming[field];
  }
  if (incoming.financingInterest !== null && (existing.financingInterest == null || incomingRicher)) {
    patch.financingInterest = incoming.financingInterest;
  }
  if (hasValue(incoming.source) && (!hasValue(existing.source) || incomingRicher)) patch.source = incoming.source;
  if (incoming.externalId && !hasValue(existing.externalId)) patch.externalId = incoming.externalId;
  if (incoming.notes) {
    const nextNotes = mergeNotes(clean(existing.notes), incoming.notes);
    if (nextNotes !== clean(existing.notes)) patch.notes = nextNotes;
  }
  const existingStatus = clean(existing.status);
  if (!['booked', 'won'].includes(existingStatus) && incoming.status && incoming.status !== existingStatus) {
    patch.status = incoming.status;
  }
  return { patch, incomingRicher };
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
        let created = 0;
        let updated = 0;
        let merged = 0;
        let duplicates = 0;
        let skipped = 0;
        const seenBatchKeys = new Set<string>();

        for (const row of rows) {
          const incoming = importLeadData(row);
          if (!incoming.name && !incoming.phone && !incoming.email) { skipped++; continue; }

          const phone = normPhone(incoming.phone);
          const email = normEmail(incoming.email);
          const batchKey = incoming.externalId || phone || email;
          if (batchKey && seenBatchKeys.has(batchKey)) {
            duplicates++;
            continue;
          }
          if (batchKey) seenBatchKeys.add(batchKey);

          const existing = await prisma.lead.findFirst({
            where: {
              OR: [
                ...(incoming.externalId ? [{ externalId: incoming.externalId }] : []),
                ...(phone ? [{ phone: { contains: phone.slice(-10) } }] : []),
                ...(email ? [{ email: { equals: email, mode: 'insensitive' as const } }] : []),
              ],
            },
          });

          if (existing) {
            const { patch, incomingRicher } = mergeLeadPatch(existing as unknown as Record<string, unknown>, incoming);
            if (Object.keys(patch).length > 0) {
              await prisma.lead.update({ where: { id: existing.id }, data: patch });
              updated++;
              if (incomingRicher) merged++;
            } else {
              duplicates++;
            }
            continue;
          }

          await prisma.lead.create({
            data: {
              ...incoming,
              name: incoming.name || incoming.email || incoming.phone || 'Imported lead',
              assignedRepId: null,
            },
          });
          created++;
        }
        return res.status(201).json({ created, updated, merged, duplicates, skipped });
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
