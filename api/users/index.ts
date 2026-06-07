import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../lib/prisma.js';
import { getCurrentUser } from '../../lib/auth.js';

const SELECT = {
  id: true, name: true, email: true, role: true,
  avatarInitial: true, avatarUrl: true, active: true,
} as const;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized.' });
    const users = await prisma.user.findMany({
      orderBy: { name: 'asc' },
      select: { ...SELECT, createdAt: true, updatedAt: true },
    });
    return res.status(200).json(users);
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
