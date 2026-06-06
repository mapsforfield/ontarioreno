import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { prisma } from '../_lib/prisma.js';
import { requireAdmin, requireAuth } from '../_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query as { id: string };

  // ── GET ──────────────────────────────────────────────────────────────────────
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

  // ── PATCH / PUT ───────────────────────────────────────────────────────────────
  if (req.method === 'PUT' || req.method === 'PATCH') {
    const authUser = await requireAuth(req, res);
    if (!authUser) return;

    const isOwnProfile = authUser.id === id;
    const isAdmin = authUser.role === 'admin';

    // Reps may only update their own profile; admins may update anyone.
    if (!isAdmin && !isOwnProfile) {
      return res.status(403).json({ error: 'Forbidden.' });
    }

    const {
      password,
      currentPassword,
      createdAt,
      updatedAt,
      id: _id,
      passwordHash: _ph,
      // Reps are not allowed to change these fields — strip them unless admin
      role: _role,
      active: _active,
      ...rest
    } = req.body;
    void createdAt; void updatedAt; void _id; void _ph;

    const data: Record<string, unknown> = {};

    // Admins may update all fields; reps may only update safe fields on their own profile.
    if (isAdmin) {
      Object.assign(data, rest);
      if (_role !== undefined) data.role = _role;
      if (_active !== undefined) data.active = _active;
    } else {
      // Reps: allow name, email, avatarUrl, avatarInitial on own profile
      const safeFields = ['name', 'email', 'avatarUrl', 'avatarInitial'] as const;
      for (const f of safeFields) {
        if (rest[f] !== undefined) data[f] = rest[f];
      }
    }

    // Password change — requires currentPassword verification when changing own pw
    if (password) {
      if (isOwnProfile && !isAdmin) {
        // Self-service password change: must supply the current password
        if (!currentPassword) {
          return res.status(400).json({ error: 'Current password is required.' });
        }
        const existing = await prisma.user.findUnique({
          where: { id },
          select: { passwordHash: true },
        });
        if (!existing) return res.status(404).json({ error: 'User not found.' });

        const match = await bcrypt.compare(currentPassword as string, existing.passwordHash);
        if (!match) {
          return res.status(400).json({ error: 'Current password is incorrect.' });
        }
      }
      data.passwordHash = await bcrypt.hash(password as string, 10);
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update.' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, avatarInitial: true, avatarUrl: true, active: true },
    });
    return res.status(200).json(updated);
  }

  // ── DELETE ────────────────────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    // Soft-delete: deactivate, never hard-delete
    await prisma.user.update({ where: { id }, data: { active: false } });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
