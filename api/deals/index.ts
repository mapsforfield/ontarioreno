import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../lib/prisma.js';
import { requireAuth } from '../../lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (req.method === 'GET') {
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
