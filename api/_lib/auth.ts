import jwt from 'jsonwebtoken';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from './prisma.js';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';
const COOKIE_NAME = 'or_token';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type JwtPayload = {
  userId: string;
  role: string;
};

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: MAX_AGE });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function setAuthCookie(res: VercelResponse, token: string): void {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=${MAX_AGE}; Path=/`
  );
}

export function clearAuthCookie(res: VercelResponse): void {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/`
  );
}

export function getTokenFromRequest(req: VercelRequest): string | null {
  // From cookie
  const cookieHeader = req.headers.cookie ?? '';
  for (const part of cookieHeader.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === COOKIE_NAME) return v.join('=');
  }
  // From Authorization header (Bearer token)
  const authHeader = req.headers.authorization ?? '';
  if (authHeader.startsWith('Bearer ')) return authHeader.slice(7);
  return null;
}

/** Verify auth and return the current User from DB, or null. */
export async function getCurrentUser(req: VercelRequest) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  return prisma.user.findUnique({ where: { id: payload.userId, active: true } });
}

/** Middleware helper — returns user or sends 401 and returns null. */
export async function requireAuth(req: VercelRequest, res: VercelResponse) {
  const user = await getCurrentUser(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized.' });
    return null;
  }
  return user;
}

/** Require admin role — sends 403 if not admin. */
export async function requireAdmin(req: VercelRequest, res: VercelResponse) {
  const user = await requireAuth(req, res);
  if (!user) return null;
  if (user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required.' });
    return null;
  }
  return user;
}
