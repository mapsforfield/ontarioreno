import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../lib/prisma.js';
import { requireAuth, requireAdmin } from '../../lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const segments = req.query['id'] as string[] | undefined;
  const id = segments?.[0];

  // ── /api/commissions (list) ───────────────────────────────────────────────────
  if (!id) {
    const user = await requireAuth(req, res);
    if (!user) return;

    if (req.method === 'GET') {
      const commissions = await prisma.commission.findMany();
      return res.status(200).json(commissions);
    }

    if (req.method === 'POST') {
      if (user.role !== 'admin') return res.status(403).json({ error: 'Admin only.' });
      const commission = await prisma.commission.create({ data: req.body });
      return res.status(201).json(commission);
    }

    return res.status(405).json({ error: 'Method not allowed.' });
  }

  // ── /api/commissions/:id (get + update) ──────────────────────────────────────
  const admin = await requireAdmin(req, res);
  if (!admin) return;

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
