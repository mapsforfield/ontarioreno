import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../lib/prisma.js';
import { requireAuth } from '../../lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const { id } = req.query as { id: string };

  if (req.method === 'GET') {
    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) return res.status(404).json({ error: 'Not found.' });
    return res.status(200).json(appointment);
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    const { createdAt, updatedAt, id: _id, dealId: rawDealId, ...rest } = req.body;
    void createdAt; void updatedAt; void _id;
    const data = {
      ...rest,
      ...(rawDealId !== undefined ? { dealId: rawDealId || null } : {}),
    };
    const appointment = await prisma.appointment.update({
      where: { id },
      data,
    });
    return res.status(200).json(appointment);
  }

  if (req.method === 'DELETE') {
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only.' });
    }
    await prisma.appointment.delete({ where: { id } });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
