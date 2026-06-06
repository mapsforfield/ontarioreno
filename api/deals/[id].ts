import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../lib/prisma.js';
import { requireAuth } from '../../lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const { id } = req.query as { id: string };

  if (req.method === 'GET') {
    const deal = await prisma.deal.findUnique({
      where: { id },
      include: { activity: { orderBy: { createdAt: 'desc' } } },
    });
    if (!deal) return res.status(404).json({ error: 'Not found.' });
    return res.status(200).json(deal);
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    const { activity, createdAt, updatedAt, id: _id, ...data } = req.body;
    void activity; void createdAt; void updatedAt; void _id;
    const deal = await prisma.deal.update({
      where: { id },
      data,
      include: { activity: { orderBy: { createdAt: 'desc' } } },
    });
    return res.status(200).json(deal);
  }

  // Add activity note
  if (req.method === 'POST') {
    const { note } = req.body as { note: string };
    if (!note) return res.status(400).json({ error: 'Note is required.' });
    const activityEntry = await prisma.dealActivity.create({
      data: { dealId: id, note },
    });
    return res.status(201).json(activityEntry);
  }

  if (req.method === 'DELETE') {
    if (user.role !== 'admin') return res.status(403).json({ error: 'Admin only.' });
    await prisma.deal.delete({ where: { id } });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
