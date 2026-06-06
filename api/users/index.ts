import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';
import { requireAdmin } from '../../lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    // Any authenticated user can list users (needed for rep pickers)
    const { getCurrentUser } = await import('../lib/auth.js');
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized.' });

    const users = await prisma.user.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarInitial: true,
        avatarUrl: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return res.status(200).json(users);
  }

  if (req.method === 'POST') {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const { name, email, password, role, avatarInitial, avatarUrl } = req.body as {
      name: string;
      email: string;
      password: string;
      role: string;
      avatarInitial: string;
      avatarUrl?: string;
    };

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        passwordHash,
        role: role ?? 'rep',
        avatarInitial: avatarInitial ?? name[0].toUpperCase(),
        avatarUrl: avatarUrl ?? null,
        active: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarInitial: true,
        avatarUrl: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return res.status(201).json(user);
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
