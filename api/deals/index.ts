import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../lib/prisma.js';
import { requireAuth } from '../../lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    // ── Sales Tracker rows ──
    if (req.query['_resource'] === 'tracker') {
      const where = user.role === 'admin' ? {} : { repId: user.id };
      const rows = await prisma.saleTracker.findMany({
        where,
        orderBy: [{ repId: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
      });
      return res.status(200).json(rows);
    }

    const deals = await prisma.deal.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        activity: { orderBy: { createdAt: 'desc' } },
        proposals: { orderBy: { sentAt: 'desc' } },
        dispatches: { orderBy: { createdAt: 'desc' } },
      },
    });
    return res.status(200).json(deals);
  }

  if (req.method === 'POST') {
    const data = req.body;

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
    const adminTotalEst = Math.round(jobValue * 0.1);

    const deal = await prisma.deal.create({
      data: {
        homeownerName: data.homeownerName,
        phone: data.phone ?? '',
        email: data.email ?? '',
        city: data.city ?? '',
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

    // Return commission id so the client can reconcile the temp commission id
    return res.status(201).json({ ...deal, _commissionId: commission.id });
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
