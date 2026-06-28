import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../lib/prisma.js';
import { requireAuth } from '../../lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  const user = await requireAuth(req, res);
  if (!user) return;

  // Single-record ops are addressed via ?id= (merged from the former
  // commissions/[id].ts to stay under Vercel Hobby's 12-function cap).
  const id = req.query['id'] as string | undefined;

  if (req.method === 'GET') {
    if (id) {
      const commission = await prisma.commission.findUnique({ where: { id } });
      if (!commission) return res.status(404).json({ error: 'Not found.' });
      return res.status(200).json(commission);
    }
    const commissions = await prisma.commission.findMany();
    return res.status(200).json(commissions);
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    if (user.role !== 'admin') return res.status(403).json({ error: 'Admin only.' });
    if (!id) return res.status(400).json({ error: 'Missing id.' });
    const { id: _id, dealId: _dealId, ...data } = req.body;
    void _id; void _dealId;
    const commission = await prisma.commission.update({ where: { id }, data });
    return res.status(200).json(commission);
  }

  if (req.method === 'POST') {
    if (user.role !== 'admin') return res.status(403).json({ error: 'Admin only.' });
    const commission = await prisma.commission.create({ data: req.body });
    return res.status(201).json(commission);
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
