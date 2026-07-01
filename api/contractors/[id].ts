import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../lib/prisma.js';
import { requireAuth, denyContractor } from '../../lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireAuth(req, res);
  if (!user) return;
  if (denyContractor(user, res)) return;

  const { id } = req.query as { id: string };

  if (req.method === 'GET') {
    const contractor = await prisma.contractor.findUnique({ where: { id } });
    if (!contractor) return res.status(404).json({ error: 'Not found.' });
    if (user.role !== 'admin') {
      // commissionRate is confidential — only admins ever receive it
      const { commissionRate, ...safe } = contractor;
      void commissionRate;
      return res.status(200).json(safe);
    }
    return res.status(200).json(contractor);
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only.' });
    }
    const { createdAt, updatedAt, id: _id, commissionRate: rawRate, ...data } = req.body;
    void createdAt; void updatedAt; void _id;
    const rate = Number(rawRate);
    const safeData = {
      ...data,
      ...(rawRate !== undefined && Number.isFinite(rate)
        ? { commissionRate: Math.min(Math.max(rate, 0), 1) }
        : {}),
    };
    const contractor = await prisma.contractor.update({ where: { id }, data: safeData });
    return res.status(200).json(contractor);
  }

  if (req.method === 'DELETE') {
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only.' });
    }
    await prisma.contractor.delete({ where: { id } });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
