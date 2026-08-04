import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../lib/prisma.js';
import { requireAuth, denyContractor } from '../../lib/auth.js';
import {
  clientIp,
  createRateLimiter,
  createSharedSpendCap,
  createTtlCache,
  type RateLimitRule,
} from '../../lib/rate-limit.js';
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
import {
  planBookingNotifications,
  planSubmissionNotifications,
  smsProviderConfigured,
  type BookingContext,
  type SubmissionContext,
} from '../../lib/notifications.js';
import {
  describeCause,
  isProviderDegradation,
  type AddressResolutionCause,
} from '../../lib/address-resolution.js';
import { drainOutbox as drainSharedOutbox } from '../../lib/notification-drain.js';
import { findNoteTemplate, parseNoteTemplates } from '../../lib/note-templates.js';
import { sendMetaEvent, splitName } from '../../lib/meta-capi.js';

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

// Interactions ride along on every lead in the list, and the portal reloads all
// 15 datasets on every doorbell ping — so anything selected here is paid for
// over and over. Only the fields the UI actually reads are shipped: the timeline
// (channel/outcome/body/occurredAt), the rep-performance aggregate (userId +
// occurredAt window), and badReason (channel/outcome).
//
// Deliberately excluded: `metadata` (Quo call/message extras — a JSON blob no
// screen reads), `subject`, `durationSeconds`, `direction`, `createdAt`. Same
// waste as the proposalBody fix: pure payload on the hottest path.
//
// NOT capped by count on purpose. Rep performance aggregates interactions over a
// user-selectable time window, so dropping the oldest rows would silently
// under-report calls on longer windows.
const interactionSelect = {
  id: true,
  leadId: true,
  userId: true,
  channel: true,
  outcome: true,
  body: true,
  occurredAt: true,
} as const;

const leadInclude = {
  interactions: { orderBy: { occurredAt: 'desc' } as const, select: interactionSelect },
};

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

    // ── Submissions log ──
    // Every consultation-flow lead ever, with NO other predicate: no deletedAt
    // filter, no status filter, no assignedRepId scope. The default list scopes
    // reps to their own assignments and these are created unassigned, and the
    // unassigned list drops anything with a terminal status — so a submission
    // that booked was visible nowhere. Nothing here may hide a row; filtering is
    // the client's job and is view-state only.
    //
    // Deliberately NOT part of the 15-dataset doorbell reload — that path is
    // paid for on every ping (see interactionSelect above). Fetched on mount.
    // Free slots for one lead, so a rep on the phone can offer the same times
    // the homeowner would have seen. Admin-only, like the log it is read from.
    if (req.query['_resource'] === 'lead_slots') {
      if (user.role !== 'admin') return res.status(403).json({ error: 'Admin only.' });
      const lead = await withTables(() =>
        prisma.lead.findUnique({ where: { id: String(req.query['leadId'] ?? '') } })
      );
      if (!lead) return res.status(404).json({ error: 'Lead not found.' });
      return res.status(200).json(await availableSlotsForLead(lead));
    }

    if (req.query['_resource'] === 'submissions') {
      if (user.role !== 'admin') return res.status(403).json({ error: 'Admin only.' });
      return await withTables(async () => {
        const leads = await prisma.lead.findMany({
          where: { source: 'consultation_flow' },
          orderBy: { submittedAt: 'desc' },
          include: leadInclude,
        });
        // appointmentId carries no Prisma relation, so booking status needs its
        // own read. Scoped to the ids we actually have.
        const appointmentIds = leads
          .map((lead) => lead.appointmentId)
          .filter((id): id is string => Boolean(id));
        const appointments = appointmentIds.length
          ? await prisma.appointment.findMany({
              where: { id: { in: appointmentIds } },
              select: {
                id: true,
                status: true,
                appointmentDate: true,
                appointmentTime: true,
                publicReference: true,
                deletedAt: true,
              },
            })
          : [];
        return res.status(200).json({ leads, appointments });
      });
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

    /**
     * Book a visit for a lead from the portal.
     *
     * Unlike the public flow this does NOT require DIRECT_CALENDAR: the whole
     * point is the leads routing sent to a person — an unverified address, an
     * unsure answer, a nurture timeline — where the rep has since spoken to the
     * homeowner and knows more than the form could. Judgement made on a phone
     * call is better evidence than an answer to a dropdown.
     *
     * Notifications are opt-in. The rep is usually mid-conversation, and a text
     * the homeowner did not ask for costs money and may say something the rep
     * has not said yet.
     */
    if (action === 'book_lead') {
      if (user.role !== 'admin') return res.status(403).json({ error: 'Admin only.' });
      const lead = await withTables(() =>
        prisma.lead.findUnique({ where: { id: clean(data.leadId) } })
      );
      if (!lead) return res.status(404).json({ error: 'Lead not found.' });
      if (lead.appointmentId) {
        return res.status(409).json({ error: 'This lead already has a booking.' });
      }

      try {
        const result = await bookVisitForLead({
          lead,
          date: clean(data.date),
          time: clean(data.time),
          notify: data.notify === true,
          bookedVia: 'portal_admin',
          createdByUserId: user.id,
        });
        if (!result.ok) return res.status(result.status).json(result.payload);

        // Only drains when something was queued, so the silent path stays silent.
        if (data.notify === true) await drainOutbox().catch(() => null);

        return res.status(201).json({
          publicReference: result.publicReference,
          date: result.date,
          time: result.time,
          notified: data.notify === true,
        });
      } catch (err) {
        console.error('[book_lead] failed:', err);
        return res.status(500).json({ error: 'Could not complete the booking.' });
      }
    }

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

    // Submissions-log worklist. Sets ONLY the three submission* columns, and
    // never calls statusForOutcome — a worklist that quietly moved lead.status
    // would be deciding things on the operator's behalf, which is the failure
    // mode this whole screen exists to correct.
    if (action === 'mark_submission_contacted') {
      if (user.role !== 'admin') return res.status(403).json({ error: 'Admin only.' });
      const leadId = clean(data.leadId);
      if (!leadId) return res.status(400).json({ error: 'Missing leadId.' });
      return await withTables(async () => {
        const lead = await prisma.lead.findUnique({ where: { id: leadId } });
        if (!lead) return res.status(404).json({ error: 'Lead not found.' });

        const note = clean(data.note);
        // Absent `contacted` means "just save the note", so editing a note never
        // silently flips the worked state.
        const contacted =
          typeof data.contacted === 'boolean' ? data.contacted : lead.submissionContactedAt != null;
        const wasContacted = lead.submissionContactedAt != null;

        const updated = await prisma.lead.update({
          where: { id: leadId },
          data: {
            // Un-marking clears the timestamp: a misclick must be reversible.
            submissionContactedAt: contacted ? lead.submissionContactedAt ?? new Date() : null,
            submissionContactedById: contacted ? lead.submissionContactedById ?? user.id : null,
            submissionOutcomeNote: note,
          },
          include: leadInclude,
        });

        // Mirror into the interaction timeline so the activity is visible from
        // the rest of the portal, not only from this page. 'note' channel, so
        // it cannot bump attemptCount or lastContactedAt.
        if (contacted !== wasContacted || note !== clean(lead.submissionOutcomeNote)) {
          await prisma.interaction
            .create({
              data: {
                leadId,
                userId: user.id,
                channel: 'note',
                direction: 'internal',
                body: [
                  contacted !== wasContacted
                    ? contacted
                      ? 'Marked contacted in the submissions log.'
                      : 'Marked back to unworked in the submissions log.'
                    : 'Submissions log note updated.',
                  note,
                ]
                  .filter(Boolean)
                  .join('\n'),
              },
            })
            .catch(() => {});
        }

        const withInteractions = await prisma.lead.findUnique({
          where: { id: leadId },
          include: leadInclude,
        });
        return res.status(200).json(withInteractions ?? updated);
      });
    }

    // Permanent delete for the submissions log. Unlike `delete_leads` above
    // this is not restricted to unassigned leads — the operator selected these
    // rows explicitly and a silent skip would leave rows on screen that they
    // believe they deleted. Interactions cascade via their FK; Appointment and
    // NotificationOutbox carry leadId as a plain column with no constraint, so
    // their history survives the lead being removed.
    /**
     * Move submissions to the Deleted tab.
     *
     * Deleting used to remove the row outright, which meant a misclick on the
     * wrong checkbox destroyed a lead with no way back. Recoverable by default
     * now; `purge_leads` still exists for when a row genuinely has to go, and is
     * reachable only from inside the Deleted view.
     */
    if (action === 'trash_leads') {
      if (user.role !== 'admin') return res.status(403).json({ error: 'Admin only.' });
      const ids = Array.isArray(data.ids) ? data.ids.map((value) => clean(value)).filter(Boolean) : [];
      if (ids.length === 0) return res.status(400).json({ error: 'No lead ids provided.' });
      return await withTables(async () => {
        const result = await prisma.lead.updateMany({
          where: { id: { in: ids } },
          data: { deletedAt: new Date() },
        });
        return res.status(200).json({ ok: true, trashed: result.count, ids });
      });
    }

    if (action === 'restore_leads') {
      if (user.role !== 'admin') return res.status(403).json({ error: 'Admin only.' });
      const ids = Array.isArray(data.ids) ? data.ids.map((value) => clean(value)).filter(Boolean) : [];
      if (ids.length === 0) return res.status(400).json({ error: 'No lead ids provided.' });
      return await withTables(async () => {
        const result = await prisma.lead.updateMany({
          where: { id: { in: ids } },
          data: { deletedAt: null },
        });
        return res.status(200).json({ ok: true, restored: result.count, ids });
      });
    }

    if (action === 'purge_leads') {
      if (user.role !== 'admin') return res.status(403).json({ error: 'Admin only.' });
      const ids = Array.isArray(data.ids) ? data.ids.map((value) => clean(value)).filter(Boolean) : [];
      if (ids.length === 0) return res.status(400).json({ error: 'No lead ids provided.' });
      return await withTables(async () => {
        const result = await prisma.lead.deleteMany({ where: { id: { in: ids } } });
        return res.status(200).json({ ok: true, deleted: result.count, ids });
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
    fundingGuidance: program.fundingGuidance,
    questions: publicQuestions(program),
    visitMinutes: program.visitMinutes,
    consultationMode: program.consultationMode,
    guideUrl: program.guideUrl,
    guideLabel: program.guideLabel,
    // Told to the client so confirmation copy can't promise a text we cannot
    // send. Flips on by itself the moment a Twilio adapter is configured.
    smsEnabled: smsProviderConfigured(),
  };
}

type PlaceSuggestion = { placeId: string; description: string };

/**
 * Ceiling on billable autocomplete calls per instance per day.
 *
 * Sized well above real demand — a homeowner spends roughly a dozen calls
 * entering an address — so it is invisible in normal operation and only bites
 * during abuse.
 */
const PLACES_DAILY_CALL_CAP = 2000;
const placesCache = createTtlCache<PlaceSuggestion[]>(5 * 60_000, 500);

/**
 * Add one to today's counter and return the new total, in a single statement.
 *
 * `ON CONFLICT ... DO UPDATE` makes this atomic without a transaction or an
 * advisory lock, so concurrent instances cannot lose an increment to a
 * read-modify-write race.
 */
async function incrementSpendCounter(key: string): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ count: number }>>`
    INSERT INTO "ApiSpendCounter" ("id", "count", "createdAt", "updatedAt")
    VALUES (${key}, 1, NOW(), NOW())
    ON CONFLICT ("id") DO UPDATE
      SET "count" = "ApiSpendCounter"."count" + 1, "updatedAt" = NOW()
    RETURNING "count"
  `;
  return rows[0]?.count ?? 0;
}

const placesSpendCap = createSharedSpendCap({
  api: 'places_autocomplete',
  dailyLimit: PLACES_DAILY_CALL_CAP,
  increment: incrementSpendCounter,
});

/** Google Places lookup. Absent key or any failure ⇒ unverified ⇒ manual review. */
async function placesAutocomplete(input: string): Promise<PlaceSuggestion[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const query = input.trim();
  // An overlong query is not a real address; refusing it before the network
  // call keeps a padded-input loop from being billable.
  if (!apiKey || query.length < 3 || query.length > 120) return [];

  const cacheKey = query.toLowerCase();
  const cached = placesCache.get(cacheKey);
  if (cached) return cached;

  // Budget exhausted: degrade to no suggestions. The homeowner can still type
  // the address, which routes to manual review rather than blocking the form.
  if (!(await placesSpendCap.tryConsume())) return [];

  try {
    const r = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey },
      body: JSON.stringify({ input: query, includedRegionCodes: ['ca'] }),
    });
    const j = (await r.json()) as {
      suggestions?: Array<{ placePrediction?: { placeId?: string; text?: { text?: string } } }>;
    };
    const suggestions = (j.suggestions ?? [])
      .map((s) => ({
        placeId: s.placePrediction?.placeId ?? '',
        description: s.placePrediction?.text?.text ?? '',
      }))
      .filter((s) => s.placeId && s.description);
    placesCache.set(cacheKey, suggestions);
    return suggestions;
  } catch {
    return [];
  }
}

/**
 * Google Places text search, used only as the fallback for a homeowner who
 * typed an address instead of picking one.
 *
 * Capped at two results on purpose: we never need to rank candidates, only to
 * learn whether there is exactly one. A second result is enough to prove
 * ambiguity, and asking for more would bill us for information we discard.
 */
async function placesTextSearch(input: string): Promise<string[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const query = input.trim();
  if (!apiKey || query.length < 6 || query.length > 120) return [];
  if (!(await placesSpendCap.tryConsume())) return [];

  const r = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id',
    },
    body: JSON.stringify({
      textQuery: query,
      // Text Search takes ONE region code as a string. `includedRegionCodes`
      // is the autocomplete spelling; sending it here is a 400, and a 400 that
      // gets read as "no results" is indistinguishable from a bad address —
      // the exact confusion this whole change exists to remove.
      regionCode: 'CA',
      maxResultCount: 2,
    }),
  });
  if (!r.ok) {
    // Thrown, not swallowed, so the caller records PROVIDER_ERROR and this
    // shows up as our outage rather than as the homeowner's bad address.
    throw new Error(`places:searchText ${r.status}: ${(await r.text()).slice(0, 300)}`);
  }
  const j = (await r.json()) as { places?: Array<{ id?: string }> };
  return (j.places ?? []).map((p) => p.id ?? '').filter(Boolean);
}

type ResolvedAddress = {
  addressState: AddressState;
  /** The place this resolved from. Empty whenever nothing resolved. */
  placeId: string;
  address: string;
  city: string;
  postalCode: string;
  province: string;
  municipality: string;
  area: SchedulingArea | null;
  latitude: number | null;
  longitude: number | null;
  /**
   * WHY this address ended up in the state it did. Routing ignores it entirely
   * — it exists so an unverified address caused by our own provider being down
   * can be told apart from one caused by the address.
   */
  cause: AddressResolutionCause;
};

const UNRESOLVED: ResolvedAddress = {
  addressState: 'ADDRESS_UNVERIFIED',
  placeId: '',
  address: '',
  city: '',
  postalCode: '',
  province: '',
  municipality: '',
  area: null,
  latitude: null,
  longitude: null,
  cause: 'PROVIDER_ERROR',
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
  if (!apiKey) return { ...UNRESOLVED, cause: 'PROVIDER_NOT_CONFIGURED' };
  if (!placeId) {
    // No suggestion was picked. Usually the homeowner typed the address — but
    // if the autocomplete budget is spent there were no suggestions TO pick,
    // and the missing placeId is our fault rather than theirs.
    return {
      ...UNRESOLVED,
      cause: placesSpendCap.exhaustedToday() ? 'PROVIDER_QUOTA_EXHAUSTED' : 'NO_PLACE_SELECTED',
    };
  }
  try {
    const r = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
      {
        headers: {
          'X-Goog-Api-Key': apiKey,
          // `location` gives us coordinates for free on a call we already make —
          // needed to keep a rep's same-day visits within the travel radius.
          'X-Goog-FieldMask': 'addressComponents,formattedAddress,location',
        },
      }
    );
    const j = (await r.json()) as {
      formattedAddress?: string;
      addressComponents?: Array<{ longText?: string; shortText?: string; types?: string[] }>;
      location?: { latitude?: number; longitude?: number };
    };
    const comps = j.addressComponents ?? [];
    const latitude = typeof j.location?.latitude === 'number' ? j.location.latitude : null;
    const longitude = typeof j.location?.longitude === 'number' ? j.location.longitude : null;
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
      return {
        ...UNRESOLVED, addressState: 'ADDRESS_OUTSIDE_SERVICE_AREA', placeId, province, municipality,
        cause: 'OUTSIDE_ONTARIO',
      };
    }
    // A missing street number or postal code means we cannot confirm a dwelling.
    if (!streetNumber || !route || !postalCode) {
      return {
        ...UNRESOLVED, placeId, address, city: municipality, postalCode, province, municipality,
        latitude, longitude,
        cause: 'INCOMPLETE_ADDRESS',
      };
    }

    const area = areaForMunicipality(municipality);
    return {
      // An unrecognised Ontario municipality stays UNVERIFIED — we may well serve
      // it (Simcoe is not mapped yet), so it must reach a human, not a decline.
      addressState: area ? 'ADDRESS_VERIFIED' : 'ADDRESS_UNVERIFIED',
      placeId,
      address,
      city: municipality,
      postalCode,
      province,
      municipality,
      area,
      latitude,
      longitude,
      cause: area ? 'RESOLVED' : 'MUNICIPALITY_UNMAPPED',
    };
  } catch (err) {
    console.error('[flow/submit] address resolution failed:', err);
    return { ...UNRESOLVED, cause: 'PROVIDER_ERROR' };
  }
}

/**
 * Resolve an address the homeowner TYPED but never picked from the dropdown.
 *
 * Tapping a suggestion is still the primary path and is untouched. This exists
 * because the tap was load-bearing and invisible: a homeowner who typed a
 * complete, correct address and pressed Continue was routed to manual review
 * for a UI convention they had no way to know about. That is our failure being
 * charged to them, and it costs real bookings.
 *
 * The rule is unchanged in spirit — ambiguity goes to a person. What changes is
 * what counts as ambiguity. Exactly one match is not ambiguous, so it resolves
 * and schedules. Zero matches or two matches stay unverified, exactly as today.
 * We never pick a "best" candidate; guessing an address someone will be driven
 * to is precisely the thing worth refusing.
 */
async function resolveTypedAddress(typed: string): Promise<ResolvedAddress> {
  const text = typed.trim();
  if (!text) return { ...UNRESOLVED, cause: 'NO_PLACE_SELECTED' };

  let candidates: string[];
  try {
    candidates = await placesTextSearch(text);
  } catch (err) {
    console.error('[flow] typed-address search failed:', err);
    return { ...UNRESOLVED, cause: 'PROVIDER_ERROR' };
  }

  if (candidates.length === 0) return { ...UNRESOLVED, cause: 'TYPED_TEXT_NO_MATCH' };
  if (candidates.length > 1) return { ...UNRESOLVED, cause: 'TYPED_TEXT_AMBIGUOUS' };

  const resolved = await resolvePlace(candidates[0]);
  // Only a clean resolution is softened into INFERRED. Outside-Ontario stays a
  // decline, and incomplete or unmapped stay unverified — arriving here by a
  // weaker route must never make an address look STRONGER than the same address
  // would have looked had it been tapped.
  if (resolved.addressState !== 'ADDRESS_VERIFIED') return resolved;
  return { ...resolved, addressState: 'ADDRESS_INFERRED', cause: 'RESOLVED_FROM_TYPED_TEXT' };
}

/**
 * The single entry point for turning what the homeowner gave us into an address.
 * A picked suggestion always wins; typed text is consulted only in its absence.
 */
async function resolveAddress(placeId: string, typed: string): Promise<ResolvedAddress> {
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    return { ...UNRESOLVED, cause: 'PROVIDER_NOT_CONFIGURED' };
  }
  if (placeId) return resolvePlace(placeId);
  // No suggestions could have been shown, so there was nothing to pick and the
  // typed text cannot be checked either. Ours to fix, not theirs.
  if (placesSpendCap.exhaustedToday()) {
    return { ...UNRESOLVED, cause: 'PROVIDER_QUOTA_EXHAUSTED' };
  }
  return resolveTypedAddress(typed);
}

/** Reps eligible for public booking, in assignment order. Names never appear. */
const BOOKABLE_REP_QUERY = {
  where: { role: 'rep', active: true, acceptsPublicBooking: true },
  select: { id: true, bookingPriority: true },
  orderBy: [{ bookingPriority: 'asc' as const }, { id: 'asc' as const }],
};

/** Fields the scheduling rules need from an existing appointment. */
const SCHEDULING_APPOINTMENT_SELECT = {
  assignedRepId: true,
  appointmentDate: true,
  appointmentTime: true,
  durationMinutes: true,
  schedulingArea: true,
  status: true,
  latitude: true,
  longitude: true,
  city: true,
};

async function loadPublicFlowLead(leadRef: string) {
  if (!leadRef) return null;
  return prisma.lead.findUnique({ where: { id: leadRef } }).catch(() => null);
}

type FlowLead = NonNullable<Awaited<ReturnType<typeof loadPublicFlowLead>>>;

/**
 * Free slots for this lead's area, honouring the rep day limits, days off and
 * the same-day travel ceiling.
 *
 * Shared by the homeowner's calendar and the portal's, for the same reason the
 * booking itself is shared: a rep offered a time in one place and not the other
 * is a rep who ends up double-booked.
 */
async function availableSlotsForLead(lead: FlowLead) {
  const empty = { slots: [] as ReturnType<typeof computeAvailability>, visitMinutes: 0 };
  if (!lead.schedulingArea) return empty;
  const program = programForArea(lead.schedulingArea as SchedulingArea);
  if (!program || !program.enabled) return empty;

  const nowWall = torontoWallClock();
  const reps = await prisma.user.findMany(BOOKABLE_REP_QUERY);
  const repIds = reps.map((r) => r.id);
  if (repIds.length === 0) return empty;

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
      select: SCHEDULING_APPOINTMENT_SELECT,
    }),
    prisma.repDayOff.findMany({
      where: { userId: { in: repIds }, date: { gte: fromDate, lte: toDate } },
      select: { userId: true, date: true },
    }),
  ]);

  const slots = computeAvailability({
    reps,
    appointments: appointments as BookedAppointment[],
    daysOff: new Set(daysOffRows.map((d) => `${d.userId}|${d.date}`)),
    area: lead.schedulingArea as SchedulingArea,
    slotStartTimes: program.slotStartTimes,
    reservationMinutes: program.reservationMinutes,
    leadTimeHours: program.leadTimeHours,
    bookingHorizonDays: program.bookingHorizonDays,
    maxBookingsPerRepPerDay: program.maxBookingsPerRepPerDay,
    primaryRepPrimingBookings: program.primaryRepPrimingBookings,
    maxSameDayTravelKm: program.maxSameDayTravelKm,
    destination: { latitude: lead.latitude, longitude: lead.longitude, city: lead.city },
    nowWallToronto: nowWall,
  });

  return { slots, visitMinutes: program.visitMinutes };
}

export type LeadBookingResult =
  | {
      ok: true;
      publicReference: string;
      date: string;
      time: string;
      durationMinutes: number;
      visitMinutes: number;
      propertyAddress: string;
      program: ProgramConfig;
    }
  | { ok: false; status: number; payload: Record<string, unknown> };

/**
 * Place a lead into a slot.
 *
 * Shared deliberately by the homeowner's own booking and by a rep booking on
 * their behalf from the portal, because the part that must not be duplicated is
 * the conflict handling: the date lock, the rep's day limits, the travel
 * ceiling. A second implementation would drift from this one, and the way that
 * failure shows up is two homeowners promised the same rep at the same hour.
 *
 * `notify` is the one real difference. A homeowner booking themselves has just
 * asked for a confirmation. A rep booking during a phone call is already
 * speaking to them, and an unexpected text costs money and says something the
 * rep may not have said yet — so the caller decides, and the portal defaults it
 * off.
 */
async function bookVisitForLead(params: {
  lead: FlowLead;
  date: string;
  time: string;
  notify: boolean;
  bookedVia: string;
  createdByUserId?: string;
}): Promise<LeadBookingResult> {
  const { lead, date, time, notify, bookedVia, createdByUserId } = params;

  if (!lead.schedulingArea) {
    return { ok: false, status: 400, payload: { error: 'This lead has no scheduling area.' } };
  }
  const program = programForArea(lead.schedulingArea as SchedulingArea);
  if (!program || !program.enabled) {
    return {
      ok: false,
      status: 403,
      payload: { error: 'Online booking is not available for this area yet.' },
    };
  }

  const nowWall = torontoWallClock();

  // The same Customer Notes template a rep would insert by hand, read from the
  // admin-editable setting so the two never drift.
  const noteTemplates = parseNoteTemplates(
    (await prisma.setting.findUnique({ where: { key: 'note_templates' } }).catch(() => null))?.value
  );
  const templateBody = program.noteTemplateId
    ? findNoteTemplate(noteTemplates, program.noteTemplateId)?.body ?? ''
    : '';

  // The rep's brief: the homeowner's own answers, in plain words rather than
  // the raw enum values the form submits.
  const leadAnswers = (lead.answersJson ?? {}) as Record<string, string>;
  const answerLabel = (key: string) => {
    const question = program.questions.find((q) => q.key === key);
    return question?.options.find((o) => o.value === leadAnswers[key])?.label ?? '';
  };
  const internalBrief = [
    bookedVia === 'public_flow'
      ? 'Booked through the public Hamilton grant flow.'
      : 'Booked from the portal on the homeowner’s behalf.',
    answerLabel('projectType') ? `Project: ${answerLabel('projectType')}` : '',
    answerLabel('timeline') ? `Timeline: ${answerLabel('timeline')}` : '',
    answerLabel('contribution') ? `Funding: ${answerLabel('contribution')}` : '',
    answerLabel('ownership') ? `Ownership: ${answerLabel('ownership')}` : '',
    lead.resolvedMunicipality ? `Municipality: ${lead.resolvedMunicipality}` : '',
  ].filter(Boolean).join('\n');

  const result = await prisma.$transaction(async (tx) => {
    const deps: BookingDeps = {
      // Serialises every booking for this date. Transaction-scoped, so it is
      // released on commit and is safe with a pooled connection.
      lockDate: async (d) => {
        await tx.$executeRawUnsafe('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', d);
      },
      listBookableReps: async () => tx.user.findMany(BOOKABLE_REP_QUERY),
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
          select: SCHEDULING_APPOINTMENT_SELECT,
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
            // A readable label, not the raw form value.
            projectType: program.appointmentProjectTypeLabel,
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
            // Same template a rep inserts when booking from the portal.
            customerNotes: request.customerNotes ?? '',
            // The homeowner's answers, so the rep arrives briefed.
            internalNotes: internalBrief,
            notes: internalBrief,
            leadId: request.lead.id,
            programKey: request.programKey,
            programVersion: request.programVersion,
            schedulingArea: request.area,
            bookedVia,
            publicReference,
            // Stored so the next booking on this rep's day can measure the
            // travel distance without re-geocoding.
            latitude: request.destination?.latitude ?? null,
            longitude: request.destination?.longitude ?? null,
            createdByUserId: createdByUserId ?? SYSTEM_BOOKING_USER_ID,
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
      maxBookingsPerRepPerDay: program.maxBookingsPerRepPerDay,
      primaryRepPrimingBookings: program.primaryRepPrimingBookings,
      maxSameDayTravelKm: program.maxSameDayTravelKm,
      destination: { latitude: lead.latitude, longitude: lead.longitude, city: lead.city },
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
      customerNotes: templateBody,
    });

    if (booking.ok) {
      await tx.lead.update({
        where: { id: lead.id },
        data: { status: 'booked', appointmentId: booking.appointmentId },
      });

      if (notify) {
        // Confirmations and reminders are written in the SAME transaction as
        // the appointment, so a provider outage can never lose a booking.
        const answers = (lead.answersJson ?? {}) as Record<string, string>;
        // The assigned rep is alerted alongside the business inbox.
        const assignedRep = await tx.user
          .findUnique({
            where: {
              id: (
                await tx.appointment.findUnique({
                  where: { id: booking.appointmentId },
                  select: { assignedRepId: true },
                })
              )?.assignedRepId ?? '',
            },
            select: { name: true, email: true },
          })
          .catch(() => null);
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
          repEmail: assignedRep?.email ?? '',
          repName: assignedRep?.name ?? '',
          // Readable answers for the team alert; the label for the customer.
          fundingPlan: answerLabel('contribution') || answers.contribution || '',
          projectScope: answerLabel('projectType') || answers.projectType || '',
          projectTypeLabel: program.appointmentProjectTypeLabel,
          customerNotes: templateBody,
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
            html: n.html ?? '',
            sendAfter: n.sendAfter,
            expiresAt: n.expiresAt,
            idempotencyKey: n.idempotencyKey,
          })),
          skipDuplicates: true,
        });
      }
    }
    return booking;
  });

  if (!result.ok) {
    return {
      ok: false,
      status: result.code === 'SLOT_UNAVAILABLE' ? 409 : 400,
      payload: result as unknown as Record<string, unknown>,
    };
  }

  return {
    ok: true,
    publicReference: result.publicReference,
    date: result.date,
    time: result.time,
    durationMinutes: result.durationMinutes,
    visitMinutes: program.visitMinutes,
    propertyAddress: [lead.address, lead.city].filter(Boolean).join(', '),
    program,
  };
}

/**
 * Meta's `_fbp` / `_fbc` cookies, which carry the click that brought the
 * homeowner here. Read from the request rather than trusted from the body:
 * they are first-party cookies on this domain, so the header is authoritative.
 */
function metaCookies(req: VercelRequest): { fbp?: string; fbc?: string } {
  const raw = req.headers.cookie ?? '';
  const read = (key: string) => {
    const hit = raw.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${key}=`));
    return hit ? decodeURIComponent(hit.slice(key.length + 1)) : undefined;
  };
  return { fbp: read('_fbp'), fbc: read('_fbc') };
}

function userAgent(req: VercelRequest): string | undefined {
  const ua = req.headers['user-agent'];
  return Array.isArray(ua) ? ua[0] : ua;
}

/**
 * Per-IP budgets for the unauthenticated flows.
 *
 * Set well above what the form actually needs, because the cost of throttling a
 * real homeowner mid-booking is far higher than the cost of letting an abuser
 * make a few extra requests. Entering an address is roughly a dozen suggest
 * calls, so sixty in ten minutes covers retyping and correction with room to
 * spare. Writes are much tighter: nobody legitimately books ten visits an hour.
 */
const PUBLIC_RATE_RULES: Record<string, RateLimitRule> = {
  program: { limit: 120, windowMs: 10 * 60_000 },
  address_suggest: { limit: 60, windowMs: 10 * 60_000 },
  // One call per attempt to leave step 1, not per keystroke, so this is tight
  // compared with suggest while still absorbing a homeowner who corrects a typo
  // several times over.
  address_resolve: { limit: 15, windowMs: 10 * 60_000 },
  availability: { limit: 120, windowMs: 10 * 60_000 },
  submit: { limit: 10, windowMs: 60 * 60_000 },
  book: { limit: 10, windowMs: 60 * 60_000 },
};

const publicLimiter = createRateLimiter();

async function handlePublicFlow(req: VercelRequest, res: VercelResponse) {
  const flow = String(req.query['flow'] ?? '');
  res.setHeader('Cache-Control', 'no-store');

  // Throttle before doing any work — the point is to avoid the database read
  // and the billable Places call, not merely to refuse afterwards. `drain` is
  // absent from the table deliberately: it carries its own secret and is
  // called by infrastructure, not by the public.
  const rule = PUBLIC_RATE_RULES[flow];
  if (rule) {
    const verdict = publicLimiter.check(`${flow}|${clientIp(req.headers)}`, rule);
    if (!verdict.allowed) {
      res.setHeader('Retry-After', String(verdict.retryAfterSeconds));
      return res
        .status(429)
        .json({ error: 'Too many requests. Please wait a moment and try again.' });
    }
  }

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

  // ── Typed address → the one place it can mean, for the homeowner to confirm ──
  // Asked when someone leaves step 1 without having picked a suggestion. Returns
  // a candidate only when the text is unambiguous; silence means "carry on", not
  // "stop", because a homeowner must never be trapped on the address step.
  if (flow === 'address_resolve' && req.method === 'GET') {
    const resolved = await resolveTypedAddress(String(req.query['q'] ?? ''));
    if (resolved.addressState !== 'ADDRESS_INFERRED') {
      return res.status(200).json({ candidate: null });
    }
    return res.status(200).json({
      candidate: {
        placeId: resolved.placeId,
        description: [resolved.address, resolved.city, resolved.province, resolved.postalCode]
          .filter(Boolean)
          .join(', '),
      },
    });
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

    const resolved = await resolveAddress(clean(body.placeId), clean(body.addressText));
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
          latitude: resolved.latitude,
          longitude: resolved.longitude,
          routingOutcome: routing.outcome,
          routingReasonCodes: routing.reasons,
          addressResolutionCause: resolved.cause,
          needsReview,
          // sourceDetail carries ATTRIBUTION (sms / meta / utm), not the routing
          // tag — routingOutcome already makes nurture leads queryable, so
          // overwriting this would have thrown away where the lead came from.
          sourceDetail: clean(body.sourceDetail) || program.slug,
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
    }

    // ── Announce the submission ──
    // Every outcome, not just the ones that reach a calendar. Keyed to the lead,
    // so no appointment is required for the team to hear about it.
    const providerDegraded = isProviderDegradation(resolved.cause);
    const submitAnswerLabel = (key: string) => {
      const question = program.questions.find((q) => q.key === key);
      return question?.options.find((o) => o.value === answers[key])?.label ?? answers[key] ?? '';
    };

    // One structured line per submission, so the share of manual-review leads
    // caused by our own degradation is greppable without querying anything.
    console.log(
      '[flow/submit]',
      JSON.stringify({
        leadId: lead.id,
        outcome: routing.outcome,
        reasons: routing.reasons,
        addressState: resolved.addressState,
        addressCause: resolved.cause,
        providerDegraded,
        municipality: resolved.municipality || null,
      })
    );
    if (providerDegraded) {
      console.error(
        `[flow/submit] address provider degraded (${resolved.cause}): ${describeCause(resolved.cause)}`
      );
    }

    const submission: SubmissionContext = {
      leadId: lead.id,
      name,
      phone,
      email,
      propertyAddress: [resolved.address, resolved.city].filter(Boolean).join(', '),
      municipality: resolved.municipality,
      outcome: routing.outcome,
      reasons: routing.reasons,
      projectScope: submitAnswerLabel('projectType'),
      fundingPlan: submitAnswerLabel('contribution'),
      timeline: submitAnswerLabel('timeline'),
      ownership: submitAnswerLabel('ownership'),
      programLabel: program.areaLabel,
      addressState: resolved.addressState,
      addressCause: resolved.cause,
      addressCauseDetail: describeCause(resolved.cause),
      providerDegraded,
      teamInbox: teamInbox(),
    };

    // Best-effort throughout: the lead is already committed and a notification
    // problem must never turn a captured submission into a 500.
    await prisma.notificationOutbox
      .createMany({
        data: planSubmissionNotifications(submission).map((n) => ({
          leadId: lead.id,
          channel: n.channel,
          kind: n.kind,
          recipient: n.recipient,
          subject: n.subject,
          body: n.body,
          html: n.html ?? '',
          sendAfter: n.sendAfter,
          expiresAt: n.expiresAt,
          idempotencyKey: n.idempotencyKey,
        })),
        // The provider alert is keyed per cause per day and will collide by
        // design on the second affected lead.
        skipDuplicates: true,
      })
      .catch((err) => {
        console.error('[flow/submit] could not queue submission alerts:', err);
      });

    // Server-side copy of the pixel's Lead event. Deduplicated against the
    // browser by eventId, and reported with the contact details as submitted,
    // which is the strongest match signal available. Best-effort like the
    // notifications above — ad reporting must never fail a captured lead.
    {
      const { firstName, lastName } = splitName(name);
      const cookies = metaCookies(req);
      await sendMetaEvent({
        eventName: 'Lead',
        eventId: clean(body.eventId) || lead.id,
        eventSourceUrl: clean(body.pageUrl) || undefined,
        userData: {
          email,
          phone,
          firstName,
          lastName,
          city: resolved.city,
          state: 'Ontario',
          country: 'ca',
          clientIp: clientIp(req.headers),
          clientUserAgent: userAgent(req),
          fbp: cookies.fbp,
          fbc: cookies.fbc,
        },
        customData: {
          content_name: program.slug,
          content_category: 'consultation',
          status: routing.outcome,
        },
      });
    }

    // Send now rather than waiting for the daily cron — a lead nobody hears
    // about for a day is most of the bug we are fixing.
    await drainOutbox().catch(() => null);
    // Wake every open portal so the lead appears in triage without a reload.
    await ringDoorbell();

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
    // Times only — no representative identity, no counts, no other bookings.
    return res.status(200).json(await availableSlotsForLead(lead));
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

    try {
      const result = await bookVisitForLead({
        lead,
        date: clean(body.date),
        time: clean(body.time),
        // The homeowner is on the page waiting for this confirmation.
        notify: true,
        bookedVia: 'public_flow',
      });

      if (!result.ok) return res.status(result.status).json(result.payload);

      await ringDoorbell();
      // Fire the immediate messages now rather than waiting for a scheduled run,
      // so the confirmation lands while the homeowner is still on the page.
      // Best-effort: the booking is already committed and must not be undone.
      const delivery = await drainOutbox().catch(() => null);

      // The booked-visit counterpart to the Lead event above.
      {
        const { firstName, lastName } = splitName(lead.name);
        const cookies = metaCookies(req);
        await sendMetaEvent({
          eventName: 'Schedule',
          eventId: clean(body.eventId) || `${lead.id}-schedule`,
          eventSourceUrl: clean(body.pageUrl) || undefined,
          userData: {
            email: lead.email,
            phone: lead.phone,
            firstName,
            lastName,
            city: lead.city,
            state: 'Ontario',
            country: 'ca',
            clientIp: clientIp(req.headers),
            clientUserAgent: userAgent(req),
            fbp: cookies.fbp,
            fbc: cookies.fbc,
          },
          customData: { content_name: result.program.slug, content_category: 'consultation' },
        });
      }

      return res.status(201).json({
        publicReference: result.publicReference,
        date: result.date,
        time: result.time,
        durationMinutes: result.durationMinutes,
        visitMinutes: result.visitMinutes,
        propertyAddress: result.propertyAddress,
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
