import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../lib/prisma.js';
import { requireAuth } from '../../lib/auth.js';

// Default "FROM" box for the commission invoice — editable & stored in Setting.
const DEFAULT_BUSINESS_PROFILE = {
  legalName: '9664327 CANADA INC.',
  addressLine1: '172 Silver Maple Rd',
  addressLine2: 'Richmond Hill, Ontario L4E 4Y8',
  hstNumber: '779706696RT0001',
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

  if (req.method === 'GET') {
    // ── Commission invoice config (admin only) ──
    if (req.query['_resource'] === 'invoice_config') {
      if (user.role !== 'admin') return res.status(403).json({ error: 'Admin only.' });
      const businessProfile = await readBusinessProfile();
      return res.status(200).json({ businessProfile });
    }

    // ── Sales Agreements ──
    if (req.query['_resource'] === 'agreements') {
      const where = user.role === 'admin' ? {} : { deal: { assignedRepId: user.id } };
      const agreements = await prisma.salesAgreement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
      return res.status(200).json(agreements);
    }

    // ── Sales Tracker rows ──
    if (req.query['_resource'] === 'tracker') {
      const where = user.role === 'admin' ? {} : { repId: user.id };
      const rows = await prisma.saleTracker.findMany({
        where,
        orderBy: [{ repId: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
      });
      return res.status(200).json(rows);
    }

    // ── Trash bin — soft-deleted deals (admin: all; rep: their own) ──
    if (req.query['_resource'] === 'trash') {
      const where = {
        deletedAt: { not: null },
        ...(user.role === 'admin' ? {} : { assignedRepId: user.id }),
      };
      try {
        const trashed = await prisma.deal.findMany({
          where,
          orderBy: { deletedAt: 'desc' },
        });
        return res.status(200).json(trashed);
      } catch {
        await prisma.$executeRawUnsafe(
          'ALTER TABLE "Deal" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3), ADD COLUMN IF NOT EXISTS "invoiceNumber" INTEGER'
        );
        const trashed = await prisma.deal.findMany({ where, orderBy: { deletedAt: 'desc' } });
        return res.status(200).json(trashed);
      }
    }

    const activeWhere = { deletedAt: null };
    let deals;
    try {
      deals = await prisma.deal.findMany({
        where: activeWhere,
        orderBy: { createdAt: 'desc' },
        include: {
          activity: { orderBy: { createdAt: 'desc' } },
          proposals: { orderBy: { sentAt: 'desc' } },
          dispatches: { orderBy: { createdAt: 'desc' } },
        },
      });
    } catch {
      // Self-healing: the deletedAt column may not exist yet (schema can't be
      // pushed from local env). Add it, then retry. Idempotent.
      await prisma.$executeRawUnsafe(
        'ALTER TABLE "Deal" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3), ADD COLUMN IF NOT EXISTS "invoiceNumber" INTEGER'
      );
      deals = await prisma.deal.findMany({
        where: activeWhere,
        orderBy: { createdAt: 'desc' },
        include: {
          activity: { orderBy: { createdAt: 'desc' } },
          proposals: { orderBy: { sentAt: 'desc' } },
          dispatches: { orderBy: { createdAt: 'desc' } },
        },
      });
    }
    return res.status(200).json(deals);
  }

  if (req.method === 'POST') {
    const data = req.body;

    // ── Save the commission-invoice business profile (admin only) ──
    if (data._action === 'save_business_profile') {
      if (user.role !== 'admin') return res.status(403).json({ error: 'Admin only.' });
      const profile = {
        legalName: String(data.legalName ?? '').slice(0, 200),
        addressLine1: String(data.addressLine1 ?? '').slice(0, 200),
        addressLine2: String(data.addressLine2 ?? '').slice(0, 200),
        hstNumber: String(data.hstNumber ?? '').slice(0, 100),
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
    const repEst = Math.round(jobValue * 0.05);
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
    const adminTotalEst = Math.round(jobValue * totalRate);

    const deal = await prisma.deal.create({
      data: {
        homeownerName: data.homeownerName,
        phone: data.phone ?? '',
        email: data.email ?? '',
        address: data.address ?? '',
        city: data.city ?? '',
        postalCode: data.postalCode ?? '',
        projectType: data.projectType,
        estimatedJobValue: jobValue,
        financingRequired: data.financingRequired ?? false,
        assignedRepId: data.assignedRepId ?? user.id,
        assignedContractorId: data.assignedContractorId ?? null,
        status: data.status ?? 'new_lead',
        notes: data.notes ?? '',
        nextFollowUpDate: data.nextFollowUpDate ?? '',
      },
      include: { activity: true, proposals: true, dispatches: true },
    });

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
