import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { signToken, setAuthCookie } from '../lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarInitial: user.avatarInitial,
      avatarUrl: user.avatarUrl,
      active: user.active,
    },
  });
}
