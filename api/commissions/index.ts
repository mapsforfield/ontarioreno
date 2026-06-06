import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    const commissions = await prisma.commission.findMany();
    return res.status(200).json(commissions);
  }

  if (req.method === 'POST') {
    if (user.role !== 'admin') return res.status(403).json({ error: 'Admin only.' });
    const data = req.body;
    const commission = await prisma.commission.create({ data });
    return res.status(201).json(commission);
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
