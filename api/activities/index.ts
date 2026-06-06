import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../lib/prisma.js';
import { requireAuth } from '../../lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    const activities = await prisma.activity.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return res.status(200).json(activities);
  }

  if (req.method === 'POST') {
    const data = req.body;
    const activity = await prisma.activity.create({
      data: {
        actorUserId: user.id,
        actorName: user.name,
        actorRole: user.role,
        actionType: data.actionType,
        actionLabel: data.actionLabel,
        entityType: data.entityType,
        entityId: data.entityId,
        entityLabel: data.entityLabel,
        dealId: data.dealId ?? null,
        contractorId: data.contractorId ?? null,
        metadata: data.metadata ?? null,
      },
    });
    return res.status(201).json(activity);
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
