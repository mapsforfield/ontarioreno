import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../lib/prisma.js';
import { requireAuth } from '../../lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    const deals = await prisma.deal.findMany({
      orderBy: { createdAt: 'desc' },
      include: { activity: { orderBy: { createdAt: 'desc' } } },
    });
    return res.status(200).json(deals);
  }

  if (req.method === 'POST') {
    const data = req.body;
    const deal = await prisma.deal.create({
      data: {
        homeownerName: data.homeownerName,
        phone: data.phone ?? '',
        email: data.email ?? '',
        city: data.city ?? '',
        projectType: data.projectType,
        estimatedJobValue: data.estimatedJobValue ?? 0,
        financingRequired: data.financingRequired ?? false,
        assignedRepId: data.assignedRepId ?? user.id,
        assignedContractorId: data.assignedContractorId ?? null,
        status: data.status ?? 'new_lead',
        notes: data.notes ?? '',
        nextFollowUpDate: data.nextFollowUpDate ?? '',
      },
      include: { activity: true },
    });
    return res.status(201).json(deal);
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
