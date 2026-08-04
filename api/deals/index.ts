import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../lib/prisma.js';
import { requireAuth, denyContractor } from '../../lib/auth.js';
import { withSchema } from '../../lib/schema.js';
import { randomUUID } from 'node:crypto';

// Self-healing ledger of commission invoices that were generated / sent.
const CREATE_INVOICE_LEDGER =
  'CREATE TABLE IF NOT EXISTS "CommissionInvoiceRecord" (' +
  '"id" TEXT PRIMARY KEY, "invoiceNumber" INTEGER, "dealId" TEXT, "contractorId" TEXT, ' +
  '"customerName" TEXT NOT NULL DEFAULT \'\', "contractorName" TEXT NOT NULL DEFAULT \'\', ' +
  '"salesPrice" DOUBLE PRECISION NOT NULL DEFAULT 0, "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0, ' +
  '"baseAmount" DOUBLE PRECISION NOT NULL DEFAULT 0, "adjustmentsTotal" DOUBLE PRECISION NOT NULL DEFAULT 0, ' +
  '"netAmount" DOUBLE PRECISION NOT NULL DEFAULT 0, "sentTo" TEXT NOT NULL DEFAULT \'\', ' +
  '"snapshot" TEXT, "sentByUserId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)';
const ALTER_INVOICE_SNAPSHOT = 'ALTER TABLE "CommissionInvoiceRecord" ADD COLUMN IF NOT EXISTS "snapshot" TEXT';

// Default "FROM" box for the commission invoice — editable & stored in Setting.
const DEFAULT_BUSINESS_PROFILE = {
  legalName: '9664327 CANADA INC.',
  addressLine1: '172 Silver Maple Rd',
  addressLine2: 'Richmond Hill, Ontario L4E 4Y8',
  hstNumber: '779706696RT0001',
  bankName: 'TD Canada Trust',
  institutionNumber: '004',
  transitNumber: '11812',
  accountNumber: '5064635',
};

async function readBusinessProfile() {
  try {
    const row = await prisma.setting.findUnique({ where: { key: 'business_profile' } });
    if (row?.value) return { ...DEFAULT_BUSINESS_PROFILE, ...JSON.parse(row.value) };
  } catch {
    // Setting table may not exist yet
    await prisma.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS "Setting" ("key" TEXT PRIMARY KEY, "value" TEXT NOT NULL DEFAULT \'\', "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)'
    );
  }
  return DEFAULT_BUSINESS_PROFILE;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireAuth(req, res);
  if (!user) return;
  if (denyContractor(user, res)) return;

  if (req.method === 'GET') {
    // ── Commission invoice config (admin only) ──
    if (req.query['_resource'] === 'invoice_config') {
      if (user.role !== 'admin') return res.status(403).json({ error: 'Admin only.' });
      const businessProfile = await readBusinessProfile();
      return res.status(200).json({ businessProfile });
    }

    // ── Next commission invoice number (admin) — advances per issuance ──
    if (req.query['_resource'] === 'next_invoice_number') {
      if (user.role !== 'admin') return res.status(403).json({ error: 'Admin only.' });
      let ledgerMax = 0;
      try {
        const r = (await prisma.$queryRawUnsafe(
          'SELECT MAX("invoiceNumber")::int AS max FROM "CommissionInvoiceRecord"',
        )) as Array<{ max: number | null }>;
        ledgerMax = r?.[0]?.max ?? 0;
      } catch { /* ledger table may not exist yet */ }
      const dealAgg = await prisma.deal.aggregate({ _max: { invoiceNumber: true } }).catch(() => ({ _max: { invoiceNumber: null } }));
      const dealMax = dealAgg._max.invoiceNumber ?? 0;
      return res.status(200).json({ next: Math.max(ledgerMax, dealMax, 4043) + 1 });
    }

    // ── Commission invoice ledger (admin only) ──
    if (req.query['_resource'] === 'invoices') {
      if (user.role !== 'admin') return res.status(403).json({ error: 'Admin only.' });
      try {
        const rows = await prisma.$queryRawUnsafe(
          'SELECT * FROM "CommissionInvoiceRecord" ORDER BY "createdAt" DESC LIMIT 500',
        );
        return res.status(200).json(rows);
      } catch {
        await prisma.$executeRawUnsafe(CREATE_INVOICE_LEDGER);
        return res.status(200).json([]);
      }
    }

    // ── Sales Agreements ──
    if (req.query['_resource'] === 'agreements') {
      const where = user.role === 'admin' ? {} : { deal: { assignedRepId: user.id } };
      const agreements = await withSchema(() =>
        prisma.salesAgreement.findMany({ where, orderBy: { createdAt: 'desc' } })
      );
      return res.status(200).json(agreements);
    }

    // ── Contract Creator presets ──
    // Presets are team-wide: whoever saves one, every rep can start from it.
    // Only the owner (or an admin) may edit or delete it.
    if (req.query['_resource'] === 'contract_presets') {
      const presets = await withSchema(() =>
        prisma.contractPreset.findMany({ orderBy: { name: 'asc' } })
      );
      return res.status(200).json(presets);
    }

    // ── Sales Tracker rows ──
    if (req.query['_resource'] === 'tracker') {
      const where = user.role === 'admin' ? {} : { repId: user.id };
      const rows = await withSchema(() =>
        prisma.saleTracker.findMany({
          where,
          orderBy: [{ repId: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
        })
      );
      return res.status(200).json(rows);
    }

    // ── Trash bin — soft-deleted deals (admin: all; rep: their own) ──
    if (req.query['_resource'] === 'trash') {
      const where = {
        deletedAt: { not: null },
        ...(user.role === 'admin' ? {} : { assignedRepId: user.id }),
      };
      const trashed = await withSchema(() =>
        prisma.deal.findMany({ where, orderBy: { deletedAt: 'desc' } })
      );
      return res.status(200).json(trashed);
    }

    const deals = await withSchema(() =>
      prisma.deal.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        include: {
          // Only the recent activity is needed for a deal's detail timeline; the
          // full history would grow unbounded and be re-serialized on every
          // refetch (the pipeline board + activity feed don't use this at all).
          activity: { orderBy: { createdAt: 'desc' }, take: 30 },
          // proposalBody holds a full HTML email — those templates run tens of KB
          // each — and nothing reads it back from loaded state; the only
          // reference in the app writes it. Fetching it here on every portal load
          // was the largest single source of Neon network transfer, which meters
          // what the DATABASE sends, not what we send the browser.
          // Capped too, so a long proposal history can't quietly regrow this.
          proposals: {
            orderBy: { sentAt: 'desc' },
            take: 20,
            select: {
              id: true,
              contractorId: true,
              dealId: true,
              templateType: true,
              proposalSubject: true,
              sentAt: true,
              sentByUserId: true,
              createdAt: true,
            },
          },
          dispatches: { orderBy: { createdAt: 'desc' }, take: 20 },
        },
      })
    );
    return res.status(200).json(deals);
  }

  if (req.method === 'POST') {
    const data = req.body;

    // ── Record a generated/sent commission invoice in the ledger (admin) ──
    if (data._action === 'record_invoice') {
      if (user.role !== 'admin') return res.status(403).json({ error: 'Admin only.' });
      const row = {
        id: randomUUID(),
        invoiceNumber: Number.isFinite(Number(data.invoiceNumber)) ? Math.round(Number(data.invoiceNumber)) : null,
        dealId: data.dealId ? String(data.dealId) : null,
        contractorId: data.contractorId ? String(data.contractorId) : null,
        customerName: String(data.customerName ?? '').slice(0, 200),
        contractorName: String(data.contractorName ?? '').slice(0, 200),
        salesPrice: Number(data.salesPrice) || 0,
        commissionRate: Number(data.commissionRate) || 0,
        baseAmount: Number(data.baseAmount) || 0,
        adjustmentsTotal: Number(data.adjustmentsTotal) || 0,
        netAmount: Number(data.netAmount) || 0,
        sentTo: String(data.sentTo ?? '').slice(0, 200),
        snapshot: data.snapshot ? String(data.snapshot).slice(0, 100000) : null,
        sentByUserId: user.id,
      };
      const insert = () =>
        prisma.$executeRawUnsafe(
          'INSERT INTO "CommissionInvoiceRecord" (id, "invoiceNumber", "dealId", "contractorId", "customerName", "contractorName", "salesPrice", "commissionRate", "baseAmount", "adjustmentsTotal", "netAmount", "sentTo", "snapshot", "sentByUserId", "createdAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, CURRENT_TIMESTAMP)',
          row.id, row.invoiceNumber, row.dealId, row.contractorId, row.customerName, row.contractorName,
          row.salesPrice, row.commissionRate, row.baseAmount, row.adjustmentsTotal, row.netAmount, row.sentTo, row.snapshot, row.sentByUserId,
        );
      try {
        await insert();
      } catch {
        await prisma.$executeRawUnsafe(CREATE_INVOICE_LEDGER);
        await prisma.$executeRawUnsafe(ALTER_INVOICE_SNAPSHOT);
        await insert();
      }
      return res.status(201).json({ ...row, createdAt: new Date().toISOString() });
    }

    // ── Delete a ledger entry (admin) ──
    if (data._action === 'delete_invoice') {
      if (user.role !== 'admin') return res.status(403).json({ error: 'Admin only.' });
      const id = String(data.id ?? '');
      if (!id) return res.status(400).json({ error: 'Missing id.' });
      try {
        await prisma.$executeRawUnsafe('DELETE FROM "CommissionInvoiceRecord" WHERE id = $1', id);
      } catch { /* nothing to delete */ }
      return res.status(200).json({ ok: true });
    }

    // ── Save the commission-invoice business profile (admin only) ──
    if (data._action === 'save_business_profile') {
      if (user.role !== 'admin') return res.status(403).json({ error: 'Admin only.' });
      const profile = {
        legalName: String(data.legalName ?? '').slice(0, 200),
        addressLine1: String(data.addressLine1 ?? '').slice(0, 200),
        addressLine2: String(data.addressLine2 ?? '').slice(0, 200),
        hstNumber: String(data.hstNumber ?? '').slice(0, 100),
        bankName: String(data.bankName ?? '').slice(0, 100),
        institutionNumber: String(data.institutionNumber ?? '').slice(0, 20),
        transitNumber: String(data.transitNumber ?? '').slice(0, 20),
        accountNumber: String(data.accountNumber ?? '').slice(0, 40),
      };
      try {
        await prisma.setting.upsert({
          where: { key: 'business_profile' },
          update: { value: JSON.stringify(profile) },
          create: { key: 'business_profile', value: JSON.stringify(profile) },
        });
      } catch {
        await prisma.$executeRawUnsafe(
          'CREATE TABLE IF NOT EXISTS "Setting" ("key" TEXT PRIMARY KEY, "value" TEXT NOT NULL DEFAULT \'\', "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)'
        );
        await prisma.setting.upsert({
          where: { key: 'business_profile' },
          update: { value: JSON.stringify(profile) },
          create: { key: 'business_profile', value: JSON.stringify(profile) },
        });
      }
      return res.status(200).json(profile);
    }

    // ── Tracker CRUD ──
    if (data._action === 'create_tracker_row') {
      const repId = user.role === 'admin' && data.repId ? data.repId : user.id;
      const maxOrder = await prisma.saleTracker.aggregate({ where: { repId }, _max: { sortOrder: true } });
      const row = await prisma.saleTracker.create({
        data: {
          repId,
          clientName: data.clientName ?? '',
          projectTotal: parseFloat(data.projectTotal) || 0,
          paymentType: data.paymentType ?? '',
          city: data.city ?? '',
          startDate: data.startDate ?? '',
          signingStatus: data.signingStatus ?? '',
          approvalStatus: data.approvalStatus ?? '',
          fundedStatus: data.fundedStatus ?? '',
          amountLeftToPay: data.amountLeftToPay != null ? parseFloat(data.amountLeftToPay) : null,
          notes: data.notes ?? '',
          onHold: data.onHold ?? false,
          sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
        },
      });
      return res.status(201).json(row);
    }

    if (data._action === 'update_tracker_row') {
      if (!data.id) return res.status(400).json({ error: 'Missing id.' });
      const existing = await prisma.saleTracker.findUnique({ where: { id: data.id } });
      if (!existing) return res.status(404).json({ error: 'Row not found.' });
      if (user.role !== 'admin' && existing.repId !== user.id) {
        return res.status(403).json({ error: 'Forbidden.' });
      }
      const updated = await prisma.saleTracker.update({
        where: { id: data.id },
        data: {
          clientName: data.clientName ?? existing.clientName,
          projectTotal: data.projectTotal != null ? parseFloat(data.projectTotal) || 0 : existing.projectTotal,
          paymentType: data.paymentType ?? existing.paymentType,
          city: data.city ?? existing.city,
          startDate: data.startDate ?? existing.startDate,
          signingStatus: data.signingStatus ?? existing.signingStatus,
          approvalStatus: data.approvalStatus ?? existing.approvalStatus,
          fundedStatus: data.fundedStatus ?? existing.fundedStatus,
          amountLeftToPay: data.amountLeftToPay != null ? parseFloat(data.amountLeftToPay) || null : existing.amountLeftToPay,
          notes: data.notes ?? existing.notes,
          onHold: data.onHold ?? existing.onHold,
          sortOrder: data.sortOrder != null ? data.sortOrder : existing.sortOrder,
        },
      });
      return res.status(200).json(updated);
    }

    // ── Parse an existing signed agreement into Contract Creator fields ──
    //
    // Reps rebuild the same 35-line scope by hand for every deal. Uploading a
    // previously signed agreement and lifting its scope and terms is far
    // faster than retyping it.
    //
    // The extraction is deliberately scoped to the *reusable* parts: scope
    // lines, pricing structure, payment terms and dates. It never returns the
    // previous homeowner's name, contact details or address — those change on
    // every deal, and carrying them into a new contract is a hazard rather
    // than a convenience. The prompt says so and the schema has nowhere to put
    // them, so a stray value can't ride along.
    if (data._action === 'parse_agreement') {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) return res.status(503).json({ error: 'Agreement parsing is not configured.' });
      const pdfBase64 = typeof data.pdfBase64 === 'string' ? data.pdfBase64 : '';
      if (!pdfBase64) return res.status(400).json({ error: 'Missing document.' });


      try {
        const { default: Anthropic } = await import('@anthropic-ai/sdk');
        const anthropic = new Anthropic({ apiKey });
        const message = await anthropic.messages.create({
          model: 'claude-opus-4-8',
          max_tokens: 16000,
          thinking: { type: 'disabled' },
          system:
            "You extract reusable contract structure from signed home-renovation service agreements so a sales rep can reuse it as a template for a NEW client.\n\nExtract the scope of work verbatim, one entry per numbered line, preserving the document order. Put the work description in `item` and any specification, material, count or qualifier in `detail`. Also extract the pricing structure, payment terms and project dates.\n\nNEVER extract the previous homeowner's name, phone number, email address, or property address, and never copy them into any field including specialTerms. They belong to a different client and must not carry over. If a scope line names the previous owner or their address, omit that name or address from the text you return.\n\nUse empty strings for anything the document does not state. Do not invent values.\n\nRespond with ONE JSON object and nothing else — no prose, no explanation, no markdown code fence. Its keys are exactly: scope (array of {item, detail}), totalPrice (number), taxNote (string), paymentMethod (\"financing\"|\"cash\"|\"both\"), financeRate, financeTermMonths, financeAmortMonths, financeMonthlyPayment, financeUpfrontPct (all bare-number strings, no % or $), cashSchedule (array of {pct, when}), startDate, completionDate (YYYY-MM-DD or empty), specialTerms (string).",
          messages: [
            {
              role: 'user',
              content: [
                { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 } },
                { type: 'text', text: 'Extract the reusable scope and terms from this agreement as the JSON object described.' },
              ],
            },
          ],
        });

        const textBlock = message.content.find((b) => b.type === 'text');
        if (!textBlock || textBlock.type !== 'text') {
          return res.status(502).json({ error: 'The document could not be read.' });
        }
        // The model is told to return bare JSON; strip a stray code fence or any
        // surrounding prose before parsing, defensively.
        const rawText = textBlock.text.trim();
        const fenceMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
        const jsonText = fenceMatch ? fenceMatch[1].trim() : rawText;
        const firstBrace = jsonText.indexOf('{');
        const lastBrace = jsonText.lastIndexOf('}');
        if (firstBrace === -1 || lastBrace <= firstBrace) {
          return res.status(502).json({ error: 'The agreement could not be read into fields.' });
        }
        const parsed = JSON.parse(jsonText.slice(firstBrace, lastBrace + 1));
        return res.status(200).json(parsed);
      } catch (err) {
        console.error('[deals] parse_agreement failed:', err);
        // Surface the API's own reason where there is one, so a genuine failure
        // is legible instead of a wall of error JSON.
        let reason = err instanceof Error ? err.message : 'Parsing failed.';
        const inner = (err as { error?: { error?: { message?: string } } })?.error?.error?.message;
        if (typeof inner === 'string' && inner) reason = inner;
        return res.status(502).json({ error: reason.slice(0, 300) });
      }
    }

    // ── Contract Creator presets ──
    if (data._action === 'save_contract_preset') {
      const name = String(data.name ?? '').trim();
      if (!name) return res.status(400).json({ error: 'A preset needs a name.' });
      if (data.payload == null) return res.status(400).json({ error: 'Missing payload.' });
      const fields = {
        name,
        // Every preset is visible to the whole team.
        shared: true,
        contractorId: String(data.contractorId ?? ''),
        templateId: String(data.templateId ?? ''),
        payload: data.payload,
      };

      if (data.id) {
        const existing = await withSchema(() =>
          prisma.contractPreset.findUnique({ where: { id: String(data.id) } })
        );
        if (!existing) return res.status(404).json({ error: 'Preset not found.' });
        if (user.role !== 'admin' && existing.ownerUserId !== user.id) {
          return res.status(403).json({ error: 'You can only edit your own presets.' });
        }
        const updated = await withSchema(() =>
          prisma.contractPreset.update({ where: { id: String(data.id) }, data: fields })
        );
        return res.status(200).json(updated);
      }

      const created = await withSchema(() =>
        prisma.contractPreset.create({ data: { ...fields, ownerUserId: user.id } })
      );
      return res.status(201).json(created);
    }

    if (data._action === 'delete_contract_preset') {
      if (!data.id) return res.status(400).json({ error: 'Missing id.' });
      const existing = await withSchema(() =>
        prisma.contractPreset.findUnique({ where: { id: String(data.id) } })
      );
      if (!existing) return res.status(404).json({ error: 'Preset not found.' });
      if (user.role !== 'admin' && existing.ownerUserId !== user.id) {
        return res.status(403).json({ error: 'You can only delete your own presets.' });
      }
      await withSchema(() => prisma.contractPreset.delete({ where: { id: String(data.id) } }));
      return res.status(200).json({ ok: true });
    }

    if (data._action === 'delete_tracker_row') {
      if (!data.id) return res.status(400).json({ error: 'Missing id.' });
      const existing = await prisma.saleTracker.findUnique({ where: { id: data.id } });
      if (!existing) return res.status(404).json({ error: 'Row not found.' });
      if (user.role !== 'admin' && existing.repId !== user.id) {
        return res.status(403).json({ error: 'Forbidden.' });
      }
      await prisma.saleTracker.delete({ where: { id: data.id } });
      return res.status(200).json({ ok: true });
    }
    const jobValue = data.estimatedJobValue ?? 0;
    const feePct = Math.max(0, Math.min(Number(data.financeFeePercent) || 0, 100));
    const commissionBase = Math.round(jobValue * (1 - feePct / 100));
    const repEst = Math.round(commissionBase * 0.05);
    // Total rate comes from the assigned contractor's negotiated rate;
    // falls back to 10% until a contractor is assigned
    let totalRate = 0.1;
    if (data.assignedContractorId) {
      const contractor = await prisma.contractor
        .findUnique({
          where: { id: data.assignedContractorId as string },
          select: { commissionRate: true },
        })
        .catch(() => null);
      if (contractor?.commissionRate != null) totalRate = contractor.commissionRate;
    }
    const adminTotalEst = Math.round(commissionBase * totalRate);

    const dealData = {
      clientId: data.clientId ?? null,
      homeownerName: data.homeownerName,
      phone: data.phone ?? '',
      email: data.email ?? '',
      address: data.address ?? '',
      city: data.city ?? '',
      postalCode: data.postalCode ?? '',
      projectType: data.projectType,
      estimatedJobValue: jobValue,
      financeFeePercent: feePct > 0 ? feePct : null,
      financingRequired: data.financingRequired ?? false,
      assignedRepId: data.assignedRepId ?? user.id,
      assignedContractorId: data.assignedContractorId ?? null,
      status: data.status ?? 'new_lead',
      notes: data.notes ?? '',
      nextFollowUpDate: data.nextFollowUpDate ?? '',
    };
    let deal;
    try {
      deal = await prisma.deal.create({ data: dealData, include: { activity: true, proposals: true, dispatches: true } });
    } catch {
      // Self-healing: the clientId column may not exist yet on older databases.
      await prisma.$executeRawUnsafe('ALTER TABLE "Deal" ADD COLUMN IF NOT EXISTS "clientId" TEXT');
      await prisma.$executeRawUnsafe('ALTER TABLE "Deal" ADD COLUMN IF NOT EXISTS "financeFeePercent" DOUBLE PRECISION');
      deal = await prisma.deal.create({ data: dealData, include: { activity: true, proposals: true, dispatches: true } });
    }

    // Create the commission record atomically with the deal
    const commission = await prisma.commission.upsert({
      where: { dealId: deal.id },
      update: {},
      create: {
        dealId: deal.id,
        repId: deal.assignedRepId,
        repCommissionRate: 0.05,
        repEstimatedCommission: repEst,
        repPaidCommission: 0,
        payoutStatus: 'pending',
        adminTotalCommissionRate: 0.1,
        adminTotalEstimatedCommission: adminTotalEst,
        adminNetCommission: adminTotalEst - repEst,
      },
    });

    // ── Auto-upsert client profile ──
    try {
      const email = deal.email?.trim();
      let client = email
        ? await prisma.client.findFirst({ where: { email } })
        : null;

      if (client) {
        await prisma.client.update({
          where: { id: client.id },
          data: {
            name: deal.homeownerName || client.name,
            phone: deal.phone || client.phone,
            address: (deal.address as string) || client.address,
            city: deal.city || client.city,
            postalCode: (deal.postalCode as string) || client.postalCode,
            projectTypes: deal.projectType
              ? Array.from(new Set([...client.projectTypes, deal.projectType]))
              : client.projectTypes,
          },
        });
      } else {
        await prisma.client.create({
          data: {
            name: deal.homeownerName,
            phone: deal.phone ?? '',
            email: deal.email ?? '',
            address: (deal.address as string) ?? '',
            city: deal.city ?? '',
            postalCode: (deal.postalCode as string) ?? '',
            projectTypes: deal.projectType ? [deal.projectType] : [],
            internalNotes: '',
            source: 'deal',
            createdByUserId: user.id,
          },
        });
      }
    } catch {
      // Client auto-linking is non-critical
    }

    // ── Auto-create My Sales tracker row for the assigned rep ──
    try {
      const maxOrder = await prisma.saleTracker.aggregate({
        where: { repId: deal.assignedRepId },
        _max: { sortOrder: true },
      });
      await prisma.saleTracker.create({
        data: {
          repId: deal.assignedRepId,
          dealId: deal.id,
          clientName: deal.homeownerName,
          projectTotal: jobValue,
          city: deal.city ?? '',
          paymentType: '',
          startDate: '',
          signingStatus: '',
          approvalStatus: '',
          fundedStatus: '',
          amountLeftToPay: null,
          notes: '',
          onHold: false,
          sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
        },
      });
    } catch {
      // Tracker row is non-critical
    }

    // Return commission id so the client can reconcile the temp commission id
    return res.status(201).json({ ...deal, _commissionId: commission.id });
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
