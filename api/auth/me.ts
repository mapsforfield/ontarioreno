import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCurrentUser } from '../lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
