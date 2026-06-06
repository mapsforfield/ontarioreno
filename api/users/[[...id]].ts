import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';
import { requireAdmin, requireAuth, getCurrentUser } from '../../lib/auth.js';

const SELECT = {
  id: true, name: true, email: true, role: true,
  avatarInitial: true, avatarUrl: true, active: true,
} as const;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // id is undefined for /api/users, ['abc'] for /api/users/abc
  const segments = req.query['id'] as string[] | undefined;
  const id = segments?.[0];

  // ── /api/users (list + create) ────────────────────────────────────────────────
  if (!id) {
    if (req.method === 'GET') {
      const user = await getCurrentUser(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized.' });
      const users = await prisma.user.findMany({
        orderBy: { name: 'asc' },
        select: { ...SELECT, createdAt: true, updatedAt: true },
      });
      return res.status(200).json(users);
    }

    if (req.method === 'POST') {
      const admin = await requireAdmin(req, res);
      if (!admin) return;
      const { name, email, password, role, avatarInitial, avatarUrl } = req.body as {
        name: string; email: string; password: string;
        role: string; avatarInitial: string; avatarUrl?: string;
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
        select: { ...SELECT, createdAt: true, updatedAt: true },
      });
      return res.status(201).json(user);
    }

    return res.status(405).json({ error: 'Method not allowed.' });
  }

  // ── /api/users/:id (get + update + delete) ────────────────────────────────────
  if (req.method === 'GET') {
    const user = await requireAuth(req, res);
    if (!user) return;
    const found = await prisma.user.findUnique({ where: { id }, select: SELECT });
    if (!found) return res.status(404).json({ error: 'Not found.' });
    return res.status(200).json(found);
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    const authUser = await requireAuth(req, res);
    if (!authUser) return;

    const isOwnProfile = authUser.id === id;
    const isAdmin = authUser.role === 'admin';
    if (!isAdmin && !isOwnProfile) return res.status(403).json({ error: 'Forbidden.' });

    const {
      password, currentPassword,
      createdAt, updatedAt, id: _id, passwordHash: _ph,
      role: _role, active: _active, ...rest
    } = req.body;
    void createdAt; void updatedAt; void _id; void _ph;

    const data: Record<string, unknown> = {};
    if (isAdmin) {
      Object.assign(data, rest);
      if (_role !== undefined) data.role = _role;
      if (_active !== undefined) data.active = _active;
    } else {
      for (const f of ['name', 'email', 'avatarUrl', 'avatarInitial'] as const) {
        if (rest[f] !== undefined) data[f] = rest[f];
      }
    }

    if (password) {
      if (isOwnProfile && !isAdmin) {
        if (!currentPassword) return res.status(400).json({ error: 'Current password is required.' });
        const existing = await prisma.user.findUnique({ where: { id }, select: { passwordHash: true } });
        if (!existing) return res.status(404).json({ error: 'User not found.' });
        const match = await bcrypt.compare(currentPassword as string, existing.passwordHash);
        if (!match) return res.status(400).json({ error: 'Current password is incorrect.' });
      }
      data.passwordHash = await bcrypt.hash(password as string, 10);
    }

    if (Object.keys(data).length === 0) return res.status(400).json({ error: 'No valid fields to update.' });

    const updated = await prisma.user.update({ where: { id }, data, select: SELECT });
    return res.status(200).json(updated);
  }

  if (req.method === 'DELETE') {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    await prisma.user.update({ where: { id }, data: { active: false } });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
