import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { requireAdmin, requireAuth } from '../lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query as { id: string };

  if (req.method === 'GET') {
    const user = await requireAuth(req, res);
    if (!user) return;
    const found = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, avatarInitial: true, avatarUrl: true, active: true },
    });
    if (!found) return res.status(404).json({ error: 'Not found.' });
    return res.status(200).json(found);
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const { password, createdAt, updatedAt, id: _id, passwordHash: _ph, ...rest } = req.body;
    void createdAt; void updatedAt; void _id; void _ph;

    const data: Record<string, unknown> = { ...rest };
    if (password) {
      data.passwordHash = await bcrypt.hash(password as string, 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, avatarInitial: true, avatarUrl: true, active: true },
    });
    return res.status(200).json(updated);
  }

  if (req.method === 'DELETE') {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    // Soft-delete: just deactivate
    await prisma.user.update({ where: { id }, data: { active: false } });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
