import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../lib/prisma.js';
import { requireAuth } from '../../lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const { id } = req.query as { id: string };

  if (req.method === 'GET') {
    const contractor = await prisma.contractor.findUnique({ where: { id } });
    if (!contractor) return res.status(404).json({ error: 'Not found.' });
    return res.status(200).json(contractor);
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only.' });
    }
    const { createdAt, updatedAt, id: _id, ...data } = req.body;
    void createdAt; void updatedAt; void _id;
    const contractor = await prisma.contractor.update({ where: { id }, data });
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
