import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../lib/prisma.js';
import { requireAuth, denyContractor } from '../../lib/auth.js';
import { ensureSchema } from '../../lib/schema.js';
import {
  areaForMunicipality,
  programBySlug,
  programForArea,
  publicQuestions,
  type AddressState,
  type ProgramConfig,
  type SchedulingArea,
} from '../../lib/program-config.js';
import { routeConsultation } from '../../lib/consultation-routing.js';
import {
  computeAvailability,
  torontoWallClock,
  type BookedAppointment,
} from '../../lib/scheduling.js';
import {
  bookSlot,
  SYSTEM_BOOKING_USER_ID,
  SYSTEM_BOOKING_USER_NAME,
  type BookingDeps,
} from '../../lib/public-booking.js';
import { planBookingNotifications, type BookingContext } from '../../lib/notifications.js';
import { drainOutbox as drainSharedOutbox } from '../../lib/notification-drain.js';

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
  // Also run the central reconcile so any future Lead/Interaction column added to
  // schema.prisma is healed here too (not just the original columns above).
  try { await ensureSchema(); } catch { /* best-effort */ }
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

function parseImportDate(value: unknown): Date {
  const raw = clean(value);
  if (!raw) return new Date();
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function importErrorReason(err: unknown): string {
  if (err instanceof Error) return err.message.split('\n')[0] || err.name;
  return clean(err) || 'Unknown import error';
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
    submittedAt: parseImportDate(row.submittedAt),
    status: statusInfo.status,
    notes,
  };
}

function hasValue(value: unknown) {
  return value !== null && value !== undefined && String(value).trim() !== '';
}

function timeValue(value: unknown) {
  const time = new Date(String(value ?? '')).getTime();
  return Number.isNaN(time) ? null : time;
}

function mergeLeadPatch(
  existing: Record<string, unknown>,
  incoming: ReturnType<typeof importLeadData>,
  statusExplicit: boolean,
  hasIncomingDate: boolean,
) {
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
  const existingSubmittedAt = timeValue(existing.submittedAt);
  const incomingSubmittedAt = timeValue(incoming.submittedAt);
  // Only advance submittedAt when the incoming row actually carried a real date.
  // A dateless re-import defaults submittedAt to "now"; bumping on that would
  // float an old lead to the top of the queue.
  if (hasIncomingDate && incomingSubmittedAt != null && (existingSubmittedAt == null || incomingSubmittedAt > existingSubmittedAt)) {
    patch.submittedAt = incoming.submittedAt;
  }
  if (incoming.notes) {
    const nextNotes = mergeNotes(clean(existing.notes), incoming.notes);
    if (nextNotes !== clean(existing.notes)) patch.notes = nextNotes;
  }
  // Never reset a dispositioned lead back to 'new' on re-import. Booked/won are
  // fully locked; any other non-'new' status only changes when the sheet carries
  // an explicit (importStatus-based) disposition. A still-'new' lead can be
  // promoted by any incoming status.
  const existingStatus = clean(existing.status);
  const incomingStatus = incoming.status;
  const canSetStatus =
    Boolean(incomingStatus) &&
    incomingStatus !== existingStatus &&
    !['booked', 'won'].includes(existingStatus) &&
    (existingStatus === 'new' || (statusExplicit && incomingStatus !== 'new'));
  if (canSetStatus) patch.status = incomingStatus;
  return { patch, incomingRicher };
}

/** Find an existing lead matching incoming by externalId / email / normalized phone. */
async function findExistingLead(incoming: ReturnType<typeof importLeadData>) {
  const phone = normPhone(incoming.phone);
  const phoneLast10 = phone.length >= 10 ? phone.slice(-10) : null;
  const email = normEmail(incoming.email);
  const prismaMatchers = [
    ...(incoming.externalId ? [{ externalId: incoming.externalId }] : []),
    ...(email ? [{ email: { equals: email, mode: 'insensitive' as const } }] : []),
  ];
  let existing = prismaMatchers.length > 0
    ? await prisma.lead.findFirst({ where: { OR: prismaMatchers } })
    : null;
  if (!existing && phoneLast10) {
    const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT "id" FROM "Lead" WHERE right(regexp_replace("phone", '[^0-9]', '', 'g'), 10) = $1 LIMIT 1`,
      phoneLast10,
    );
    if (rows[0]) existing = await prisma.lead.findUnique({ where: { id: rows[0].id } });
  }
  return existing;
}

/** Ring the realtime "doorbell" so every open portal refetches and the new lead
 *  appears immediately. Server-side publish (the intake endpoint is unauthenticated
 *  so it can't use the client's doorbell). Best-effort — realtime is optional. */
async function ringDoorbell() {
  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) return;
  try {
    const { Rest } = await import('ably');
    await new Rest(apiKey).channels.get('portal-changes').publish('change', { at: Date.now(), source: 'intake' });
  } catch (err) {
    console.error('[leads/intake] doorbell failed:', err);
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
  // Parse with the same logic as the bulk importer, so website/Meta rows get the
  // same field mapping, extra-answers-into-notes, and source handling.
  const incoming = importLeadData(data);
  if (!incoming.name && !incoming.phone && !incoming.email) {
    return res.status(400).json({ error: 'A name, phone, or email is required.' });
  }

  try {
    const result = await withTables(async () => {
      const existing = await findExistingLead(incoming);
      if (existing) {
        // Enrich an existing lead (e.g. richer website data over a sparse Meta lead)
        // — same merge rules as the importer; never resurrects a dispositioned lead.
        const statusExplicit = clean(data.importStatus) !== '';
        const dateRaw = clean(data.submittedAt);
        const hasIncomingDate = dateRaw !== '' && !Number.isNaN(new Date(dateRaw).getTime());
        const { patch } = mergeLeadPatch(existing as unknown as Record<string, unknown>, incoming, statusExplicit, hasIncomingDate);
        if (Object.keys(patch).length > 0) {
          await prisma.lead.update({ where: { id: existing.id }, data: patch });
        }
        return { id: existing.id, merged: true };
      }
      const created = await prisma.lead.create({
        data: {
          ...incoming,
          name: incoming.name || incoming.email || incoming.phone || 'Website lead',
          assignedRepId: null, // always land unassigned → admin triage
        },
        select: { id: true },
      });
      return { id: created.id, merged: false };
    });
    await ringDoorbell();
    // Merge → 200, create → 201; always ok so the sender never retry-storms.
    return res.status(result.merged ? 200 : 201).json({ ok: true, ...result });
  } catch (err) {
    console.error('[leads/intake] failed:', err);
    return res.status(200).json({ ok: false });
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
        let failed = 0;
        const failures: Array<{ row: number; name?: string; reason: string }> = [];
        const seenBatchKeys = new Set<string>();

        for (let index = 0; index < rows.length; index++) {
          const row = rows[index];
          let rowKey: string | null = null;
          try {
            const incoming = importLeadData(row);
            if (!incoming.name && !incoming.phone && !incoming.email) { skipped++; continue; }

            const phone = normPhone(incoming.phone);
            // Only dedupe on a full (>=10 digit) phone; short/partial numbers are
            // too collision-prone to merge on.
            const phoneLast10 = phone.length >= 10 ? phone.slice(-10) : null;
            const email = normEmail(incoming.email);
            rowKey = incoming.externalId || phoneLast10 || email || null;
            if (rowKey && seenBatchKeys.has(rowKey)) {
              duplicates++;
              continue;
            }
            if (rowKey) seenBatchKeys.add(rowKey);

            // externalId + email match via Prisma; phone matches via normalized
            // last-10-digit equality so any stored format (+1 / dashes / parens) merges.
            const prismaMatchers = [
              ...(incoming.externalId ? [{ externalId: incoming.externalId }] : []),
              ...(email ? [{ email: { equals: email, mode: 'insensitive' as const } }] : []),
            ];
            let existing = prismaMatchers.length > 0
              ? await prisma.lead.findFirst({ where: { OR: prismaMatchers } })
              : null;
            if (!existing && phoneLast10) {
              const phoneMatches = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
                `SELECT "id" FROM "Lead" WHERE right(regexp_replace("phone", '[^0-9]', '', 'g'), 10) = $1 LIMIT 1`,
                phoneLast10,
              );
              if (phoneMatches[0]) existing = await prisma.lead.findUnique({ where: { id: phoneMatches[0].id } });
            }

            if (existing) {
              const statusExplicit = clean(row.importStatus) !== '';
              const incomingDateRaw = clean(row.submittedAt);
              const hasIncomingDate = incomingDateRaw !== '' && !Number.isNaN(new Date(incomingDateRaw).getTime());
              const { patch, incomingRicher } = mergeLeadPatch(existing as unknown as Record<string, unknown>, incoming, statusExplicit, hasIncomingDate);
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
          } catch (err) {
            failed++;
            const reason = importErrorReason(err);
            const failure = { row: index + 2, name: clean(row.name), reason };
            failures.push(failure);
            console.error('[leads/import] row failed', failure, err);
            if (rowKey) seenBatchKeys.delete(rowKey);
          }
        }
        return res.status(201).json({
          created,
          updated,
          merged,
          duplicates,
          skipped,
          failed,
          failures,
        });
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

    if (action === 'delete_leads') {
      if (user.role !== 'admin') return res.status(403).json({ error: 'Admin only.' });
      const ids = Array.isArray(data.ids) ? data.ids.map((value) => clean(value)).filter(Boolean) : [];
      if (ids.length === 0) return res.status(400).json({ error: 'No lead ids provided.' });

      return await withTables(async () => {
        const leads = await prisma.lead.findMany({
          where: { id: { in: ids }, assignedRepId: null },
          select: { id: true },
        });
        const leadIds = leads.map((lead) => lead.id);
        if (leadIds.length === 0) return res.status(200).json({ ok: true, deleted: 0 });

        await prisma.interaction.deleteMany({ where: { leadId: { in: leadIds } } });
        const result = await prisma.lead.deleteMany({ where: { id: { in: leadIds } } });
        return res.status(200).json({ ok: true, deleted: result.count });
      });
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

// ─── Public consultation flow (?flow=…) — UNAUTHENTICATED by design ───────────
// Meta lead → qualification → routing → calendar → booking. A homeowner never
// has, and never needs, a portal account. Every decision that matters (address
// state, scheduling area, program, routing outcome, rep assignment) is made here
// on the server; the browser only ever submits answers and a chosen time.

const ACTIVE_APPOINTMENT_STATUSES = ['scheduled', 'confirmed', 'rescheduled', 'completed'];

/** CRM tag applied to leads that bypass the calendar. */
const NURTURE_TAG = 'Hamilton ADU - Nurture Pipeline';

function teamInbox(): string {
  const from = process.env.EMAIL_FROM ?? 'OntarioReno <info@ontarioreno.ca>';
  const match = from.match(/<([^\s@>]+@[^\s@>]+\.[^\s@>]+)>/);
  return match ? match[1] : from.trim();
}

/** Deliver whatever is due, via the shared drain (lib/notification-drain.ts). */
async function drainOutbox(limit = 25) {
  return drainSharedOutbox(prisma as never, limit);
}

function publicProgramPayload(program: ProgramConfig) {
  return {
    key: program.key,
    version: program.version,
    slug: program.slug,
    areaLabel: program.areaLabel,
    enabled: program.enabled,
    displayAmountLabel: program.displayAmountLabel,
    fundingHighlights: program.fundingHighlights,
    programTerms: program.programTerms,
    whyFreeText: program.whyFreeText,
    questions: publicQuestions(program),
    visitMinutes: program.visitMinutes,
    consultationMode: program.consultationMode,
    guideUrl: program.guideUrl,
    guideLabel: program.guideLabel,
  };
}

/** Google Places lookup. Absent key or any failure ⇒ unverified ⇒ manual review. */
async function placesAutocomplete(input: string) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey || input.trim().length < 3) return [];
  try {
    const r = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey },
      body: JSON.stringify({ input, includedRegionCodes: ['ca'] }),
    });
    const j = (await r.json()) as {
      suggestions?: Array<{ placePrediction?: { placeId?: string; text?: { text?: string } } }>;
    };
    return (j.suggestions ?? [])
      .map((s) => ({
        placeId: s.placePrediction?.placeId ?? '',
        description: s.placePrediction?.text?.text ?? '',
      }))
      .filter((s) => s.placeId && s.description);
  } catch {
    return [];
  }
}

type ResolvedAddress = {
  addressState: AddressState;
  address: string;
  city: string;
  postalCode: string;
  province: string;
  municipality: string;
  area: SchedulingArea | null;
};

const UNRESOLVED: ResolvedAddress = {
  addressState: 'ADDRESS_UNVERIFIED',
  address: '',
  city: '',
  postalCode: '',
  province: '',
  municipality: '',
  area: null,
};

/**
 * Resolve a picked place into a verified address plus a scheduling area.
 *
 * A verified address means only that it standardised cleanly and sits in a
 * municipality we map — never that the property qualifies for anything. Anything
 * ambiguous returns ADDRESS_UNVERIFIED so routing sends it to a person.
 */
async function resolvePlace(placeId: string): Promise<ResolvedAddress> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey || !placeId) return UNRESOLVED;
  try {
    const r = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
      {
        headers: {
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'addressComponents,formattedAddress',
        },
      }
    );
    const j = (await r.json()) as {
      formattedAddress?: string;
      addressComponents?: Array<{ longText?: string; shortText?: string; types?: string[] }>;
    };
    const comps = j.addressComponents ?? [];
    const pick = (type: string) => comps.find((c) => (c.types ?? []).includes(type));

    const streetNumber = pick('street_number')?.longText ?? '';
    const route = pick('route')?.longText ?? '';
    const postalCode = pick('postal_code')?.longText ?? '';
    const province = pick('administrative_area_level_1')?.shortText ?? '';
    // Hamilton is amalgamated, so Places often returns the community name.
    const municipality =
      pick('locality')?.longText ??
      pick('administrative_area_level_3')?.longText ??
      pick('postal_town')?.longText ??
      pick('administrative_area_level_2')?.longText ??
      '';
    const address = [streetNumber, route].filter(Boolean).join(' ');

    // Outside Ontario is the one address fact we can decline on with confidence.
    if (province && province !== 'ON') {
      return { ...UNRESOLVED, addressState: 'ADDRESS_OUTSIDE_SERVICE_AREA', province, municipality };
    }
    // A missing street number or postal code means we cannot confirm a dwelling.
    if (!streetNumber || !route || !postalCode) {
      return { ...UNRESOLVED, address, city: municipality, postalCode, province, municipality };
    }

    const area = areaForMunicipality(municipality);
    return {
      // An unrecognised Ontario municipality stays UNVERIFIED — we may well serve
      // it (Simcoe is not mapped yet), so it must reach a human, not a decline.
      addressState: area ? 'ADDRESS_VERIFIED' : 'ADDRESS_UNVERIFIED',
      address,
      city: municipality,
      postalCode,
      province,
      municipality,
      area,
    };
  } catch {
    return UNRESOLVED;
  }
}

async function loadPublicFlowLead(leadRef: string) {
  if (!leadRef) return null;
  return prisma.lead.findUnique({ where: { id: leadRef } }).catch(() => null);
}

async function handlePublicFlow(req: VercelRequest, res: VercelResponse) {
  const flow = String(req.query['flow'] ?? '');
  res.setHeader('Cache-Control', 'no-store');

  // ── Program config for the page ──
  if (flow === 'program' && req.method === 'GET') {
    const program = programBySlug(String(req.query['slug'] ?? ''));
    if (!program) return res.status(404).json({ error: 'Unknown program.' });
    return res.status(200).json(publicProgramPayload(program));
  }

  // ── Address autocomplete ──
  if (flow === 'address_suggest' && req.method === 'GET') {
    const suggestions = await placesAutocomplete(String(req.query['q'] ?? ''));
    return res.status(200).json({ suggestions });
  }

  // ── Submit qualification → route → create Lead ──
  if (flow === 'submit' && req.method === 'POST') {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const name = clean(body.name);
    const phone = clean(body.phone);
    const email = normEmail(body.email);
    if (!name || (!phone && !email)) {
      return res.status(400).json({ error: 'A name and a phone number or email are required.' });
    }

    const requested = programBySlug(clean(body.programSlug) || 'hamilton');
    if (!requested) return res.status(404).json({ error: 'Unknown program.' });

    const resolved = await resolvePlace(clean(body.placeId));
    // The program comes from the resolved address, never from the homeowner.
    const areaProgram = programForArea(resolved.area);
    const program = areaProgram ?? requested;

    const answers: Record<string, string> = {};
    const rawAnswers = (body.answers ?? {}) as Record<string, unknown>;
    for (const question of program.questions) {
      answers[question.key] = clean(rawAnswers[question.key]);
    }

    const routing = routeConsultation({
      addressState: resolved.addressState,
      area: resolved.area,
      program: areaProgram,
      answers,
    });

    const needsReview = routing.outcome === 'MANUAL_REVIEW';
    const isNurture = routing.outcome === 'NURTURE';
    const lead = await withTables(() =>
      prisma.lead.create({
        data: {
          name,
          phone,
          email,
          address: resolved.address,
          city: resolved.city,
          postalCode: resolved.postalCode,
          projectType: answers.projectType ?? '',
          source: 'consultation_flow',
          status: 'new',
          assignedRepId: null,
          programKey: program.key,
          programVersion: program.version,
          schedulingArea: resolved.area,
          addressState: resolved.addressState,
          resolvedMunicipality: resolved.municipality,
          answersJson: answers,
          routingOutcome: routing.outcome,
          routingReasonCodes: routing.reasons,
          needsReview,
          // Tag the nurture pipeline on the lead itself so the CRM can filter it
          // without needing to understand routing internals.
          sourceDetail: isNurture ? NURTURE_TAG : (clean(body.sourceDetail) || program.slug),
          notes: [clean(body.notes), isNurture ? `CRM tag: ${NURTURE_TAG}` : '']
            .filter(Boolean)
            .join('\n'),
        },
        select: { id: true },
      })
    );

    // Nurture leads get the guide by email instead of a live consultation slot.
    if (isNurture && email && program.guideUrl) {
      await prisma.notificationOutbox
        .create({
          data: {
            leadId: lead.id,
            channel: 'email',
            kind: 'nurture_guide',
            recipient: email,
            subject: `Your ${program.guideLabel}`,
            body: [
              `Hi ${name},`,
              '',
              `Here's the full guide to how the ${program.areaLabel} grant works — what qualifies,`,
              'realistic costs, and the permit process.',
              '',
              `https://ontarioreno.ca${program.guideUrl}`,
              '',
              'When you\'re closer to starting, we can book a site visit and go through your',
              'property specifically. No rush, and no obligation.',
              '',
              'OntarioReno',
            ].join('\n'),
            sendAfter: new Date().toISOString(),
            idempotencyKey: `${lead.id}:email:nurture_guide`,
          },
        })
        .catch(() => {});
      await drainOutbox().catch(() => null);
    }

    return res.status(201).json({
      leadRef: lead.id,
      outcome: routing.outcome,
      reasons: routing.reasons,
      program: publicProgramPayload(program),
      offersCalendar: routing.outcome === 'DIRECT_CALENDAR',
    });
  }

  // ── Availability ──
  if (flow === 'availability' && req.method === 'GET') {
    const lead = await loadPublicFlowLead(String(req.query['leadRef'] ?? ''));
    if (!lead) return res.status(404).json({ error: 'Session not found.' });
    if (lead.routingOutcome !== 'DIRECT_CALENDAR' || !lead.schedulingArea) {
      return res.status(200).json({ slots: [] });
    }
    const program = programForArea(lead.schedulingArea as SchedulingArea);
    if (!program || !program.enabled) return res.status(200).json({ slots: [] });

    const nowWall = torontoWallClock();
    const reps = await prisma.user.findMany({
      where: { role: 'rep', active: true, acceptsPublicBooking: true },
      select: { id: true },
    });
    const repIds = reps.map((r) => r.id);
    if (repIds.length === 0) return res.status(200).json({ slots: [] });

    const fromDate = nowWall.slice(0, 10);
    const toDate = new Date(
      Date.UTC(
        Number(fromDate.slice(0, 4)),
        Number(fromDate.slice(5, 7)) - 1,
        Number(fromDate.slice(8, 10)) + program.bookingHorizonDays + 1
      )
    )
      .toISOString()
      .slice(0, 10);

    const [appointments, daysOffRows] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          assignedRepId: { in: repIds },
          appointmentDate: { gte: fromDate, lte: toDate },
          deletedAt: null,
          status: { in: ACTIVE_APPOINTMENT_STATUSES },
        },
        select: {
          assignedRepId: true,
          appointmentDate: true,
          appointmentTime: true,
          durationMinutes: true,
          schedulingArea: true,
          status: true,
        },
      }),
      prisma.repDayOff.findMany({
        where: { userId: { in: repIds }, date: { gte: fromDate, lte: toDate } },
        select: { userId: true, date: true },
      }),
    ]);

    const slots = computeAvailability({
      repIds,
      appointments: appointments as BookedAppointment[],
      daysOff: new Set(daysOffRows.map((d) => `${d.userId}|${d.date}`)),
      area: lead.schedulingArea as SchedulingArea,
      slotStartTimes: program.slotStartTimes,
      reservationMinutes: program.reservationMinutes,
      leadTimeHours: program.leadTimeHours,
      bookingHorizonDays: program.bookingHorizonDays,
      nowWallToronto: nowWall,
    });

    // Times only — no representative identity, no counts, no other bookings.
    return res.status(200).json({ slots, visitMinutes: program.visitMinutes });
  }

  // ── Book ──
  if (flow === 'book' && req.method === 'POST') {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const lead = await loadPublicFlowLead(clean(body.leadRef));
    if (!lead) return res.status(404).json({ error: 'Session not found.' });
    if (lead.appointmentId) {
      return res.status(409).json({ error: 'This request already has a booking.' });
    }
    if (lead.routingOutcome !== 'DIRECT_CALENDAR' || !lead.schedulingArea) {
      return res.status(403).json({ error: 'This request is not eligible for online booking.' });
    }
    const program = programForArea(lead.schedulingArea as SchedulingArea);
    if (!program || !program.enabled) {
      return res.status(403).json({ error: 'Online booking is not available for this area yet.' });
    }

    const date = clean(body.date);
    const time = clean(body.time);
    const nowWall = torontoWallClock();

    try {
      const result = await prisma.$transaction(async (tx) => {
        const deps: BookingDeps = {
          // Serialises every booking for this date. Transaction-scoped, so it is
          // released on commit and is safe with a pooled connection.
          lockDate: async (d) => {
            await tx.$executeRawUnsafe(
              'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
              d
            );
          },
          listBookableRepIds: async () =>
            (
              await tx.user.findMany({
                where: { role: 'rep', active: true, acceptsPublicBooking: true },
                select: { id: true },
              })
            ).map((r) => r.id),
          listDaysOff: async (repIds, d) =>
            new Set(
              (
                await tx.repDayOff.findMany({
                  where: { userId: { in: repIds }, date: d },
                  select: { userId: true, date: true },
                })
              ).map((row) => `${row.userId}|${row.date}`)
            ),
          listAppointments: async (repIds, d) =>
            (await tx.appointment.findMany({
              where: {
                assignedRepId: { in: repIds },
                appointmentDate: d,
                deletedAt: null,
                status: { in: ACTIVE_APPOINTMENT_STATUSES },
              },
              select: {
                assignedRepId: true,
                appointmentDate: true,
                appointmentTime: true,
                durationMinutes: true,
                schedulingArea: true,
                status: true,
              },
            })) as BookedAppointment[],
          createAppointment: async ({ repId, publicReference, request }) => {
            // Audit-only identity. Inactive and password-less, so it can never
            // sign in and never makes the portal part of this journey.
            await tx.user.upsert({
              where: { id: SYSTEM_BOOKING_USER_ID },
              update: {},
              create: {
                id: SYSTEM_BOOKING_USER_ID,
                name: SYSTEM_BOOKING_USER_NAME,
                email: 'system-public-booking@ontarioreno.internal',
                role: 'system',
                avatarInitial: 'S',
                active: false,
                acceptsPublicBooking: false,
              },
            });
            const created = await tx.appointment.create({
              data: {
                customerName: request.lead.name,
                phone: request.lead.phone,
                email: request.lead.email,
                address: request.lead.address,
                city: request.lead.city,
                postalCode: request.lead.postalCode,
                projectType: request.lead.projectType,
                assignedRepId: repId,
                appointmentDate: request.date,
                appointmentTime: request.time,
                durationMinutes: request.reservationMinutes,
                // Follows the program's consultation mode so the calendar entry
                // matches what the homeowner was told they were booking.
                appointmentType:
                  program.consultationMode === 'phone' ? 'phone_consultation' : 'home_visit',
                status: 'scheduled',
                source: 'manual',
                location: [request.lead.address, request.lead.city].filter(Boolean).join(', '),
                customerNotes: request.customerNotes ?? '',
                leadId: request.lead.id,
                programKey: request.programKey,
                programVersion: request.programVersion,
                schedulingArea: request.area,
                bookedVia: 'public_flow',
                publicReference,
                createdByUserId: SYSTEM_BOOKING_USER_ID,
              },
              select: { id: true },
            });
            return created;
          },
        };

        const booking = await bookSlot(deps, {
          date,
          time,
          area: lead.schedulingArea as SchedulingArea,
          slotStartTimes: program.slotStartTimes,
          reservationMinutes: program.reservationMinutes,
          leadTimeHours: program.leadTimeHours,
          bookingHorizonDays: program.bookingHorizonDays,
          nowWallToronto: nowWall,
          programKey: program.key,
          programVersion: program.version,
          lead: {
            id: lead.id,
            name: lead.name,
            phone: lead.phone,
            email: lead.email,
            address: lead.address,
            city: lead.city,
            postalCode: lead.postalCode,
            projectType: lead.projectType,
          },
          customerNotes: clean(body.notes),
        });

        if (booking.ok) {
          await tx.lead.update({
            where: { id: lead.id },
            data: { status: 'booked', appointmentId: booking.appointmentId },
          });

          // Confirmations and reminders are written in the SAME transaction as
          // the appointment, so a provider outage can never lose a booking.
          const answers = (lead.answersJson ?? {}) as Record<string, string>;
          const propertyAddress = [lead.address, lead.city].filter(Boolean).join(', ') || lead.address;
          const context: BookingContext = {
            appointmentId: booking.appointmentId,
            publicReference: booking.publicReference,
            name: lead.name,
            phone: lead.phone,
            email: lead.email,
            propertyAddress,
            date: booking.date,
            time: booking.time,
            visitMinutes: program.visitMinutes,
            consultationMode: program.consultationMode,
            teamInbox: teamInbox(),
            fundingPlan: answers.contribution ?? '',
            projectScope: answers.projectType ?? '',
          };
          await tx.notificationOutbox.createMany({
            data: planBookingNotifications(context).map((n) => ({
              appointmentId: booking.appointmentId,
              leadId: lead.id,
              channel: n.channel,
              kind: n.kind,
              recipient: n.recipient,
              subject: n.subject,
              body: n.body,
              sendAfter: n.sendAfter,
              idempotencyKey: n.idempotencyKey,
            })),
            skipDuplicates: true,
          });
        }
        return booking;
      });

      if (!result.ok) {
        return res.status(result.code === 'SLOT_UNAVAILABLE' ? 409 : 400).json(result);
      }
      await ringDoorbell();
      // Fire the immediate messages now rather than waiting for a scheduled run,
      // so the confirmation lands while the homeowner is still on the page.
      // Best-effort: the booking is already committed and must not be undone.
      const delivery = await drainOutbox().catch(() => null);
      return res.status(201).json({
        publicReference: result.publicReference,
        date: result.date,
        time: result.time,
        durationMinutes: result.durationMinutes,
        visitMinutes: program.visitMinutes,
        propertyAddress: [lead.address, lead.city].filter(Boolean).join(', '),
        notifications: delivery,
      });
    } catch (err) {
      console.error('[flow/book] failed:', err);
      return res.status(500).json({ error: 'We could not complete the booking. Please try again.' });
    }
  }

  // ── Reminder drain (cron-authenticated, not public) ──
  // Reminders are scheduled at booking time; this delivers whatever is due.
  // Vercel crons run against Production only, so preview never sends.
  if (flow === 'drain') {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || req.headers.authorization !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    const summary = await drainOutbox(100).catch((err) => ({ error: String(err) }));
    return res.status(200).json({ ok: true, ...summary });
  }

  return res.status(404).json({ error: 'Unknown flow action.' });
}

// ─── Router (by query param — robust on Vercel, no catch-all) ─────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Public consultation flow — unauthenticated, handled before requireAuth so a
  // homeowner never encounters a login.
  if (req.query['flow'] !== undefined) {
    return handlePublicFlow(req, res);
  }

  // Intake is unauthenticated (token-gated) — handle before requireAuth.
  if (req.query['intake'] !== undefined) {
    return handleIntake(req, res);
  }

  const user = await requireAuth(req, res);
  if (!user) return;
  if (denyContractor(user, res)) return;

  const id = req.query['id'] as string | undefined;
  if (id) return handleById(req, res, user, id);
  return handleCollection(req, res, user);
}
