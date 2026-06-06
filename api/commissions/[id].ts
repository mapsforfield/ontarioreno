import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../_lib/prisma.js';
import { requireAdmin } from '../_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const { id } = req.query as { id: string };

  if (req.method === 'GET') {
    const commission = await prisma.commission.findUnique({ where: { id } });
    if (!commission) return res.status(404).json({ error: 'Not found.' });
    return res.status(200).json(commission);
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    const { id: _id, dealId: _dealId, ...data } = req.body;
    void _id; void _dealId;
    const commission = await prisma.commission.update({ where: { id }, data });
    return res.status(200).json(commission);
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
