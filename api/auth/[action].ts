import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';
import {
  signToken,
  setAuthCookie,
  clearAuthCookie,
  getCurrentUser,
} from '../../lib/auth.js';

/**
 * Single handler for all auth routes:
 *   POST /api/auth/login   — bcrypt password check, set JWT cookie
 *   POST /api/auth/logout  — clear JWT cookie
 *   GET  /api/auth/me      — return current user from JWT cookie
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = req.query['action'] as string;

  // ── /api/auth/login ──────────────────────────────────────────────────────────
  if (action === 'login') {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed.' });
    }

    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !user.active || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = signToken({ userId: user.id, role: user.role });
    setAuthCookie(res, token);

    return res.status(200).json({
      ok: true,
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarInitial: user.avatarInitial,
      avatarUrl: user.avatarUrl,
      active: user.active,
    });
  }

  // ── /api/auth/logout ─────────────────────────────────────────────────────────
  if (action === 'logout') {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed.' });
    }
    clearAuthCookie(res);
    return res.status(200).json({ ok: true });
  }

  // ── /api/auth/me ─────────────────────────────────────────────────────────────
  if (action === 'me') {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed.' });
    }
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }
    return res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarInitial: user.avatarInitial,
      avatarUrl: user.avatarUrl,
      active: user.active,
    });
  }

  return res.status(404).json({ error: 'Unknown auth action.' });
}
