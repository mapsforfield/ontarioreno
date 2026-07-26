import jwt from 'jsonwebtoken';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from './prisma.js';

// Fail closed: a missing JWT_SECRET in production used to silently fall back to
// a well-known literal committed to this repository, which made every portal
// session forgeable by anyone who had read the source. Refusing to start is the
// correct behaviour — a 500 is recoverable, a forgeable admin session is not.
// The dev fallback is retained so local work and tests need no configuration.
const DEV_JWT_SECRET = 'dev-secret-change-in-production';

function resolveJwtSecret(): string {
  const configured = process.env.JWT_SECRET;
  if (typeof configured === 'string' && configured.length > 0) return configured;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'JWT_SECRET is not set. Refusing to sign or verify session tokens with the development fallback.'
    );
  }
  return DEV_JWT_SECRET;
}

const COOKIE_NAME = 'or_token';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type JwtPayload = {
  userId: string;
  role: string;
};

// Authentication runs in front of nearly every portal API request. Keep this
// projection deliberately small: avatarUrl can be a base64 image and pulling it
// (plus the password hash and timestamps) on every request creates substantial
// Neon egress without contributing to authorization.
const AUTH_USER_SELECT = {
  id: true,
  name: true,
  role: true,
  email: true,
  active: true,
  contractorId: true,
} as const;

const PROFILE_USER_SELECT = {
  ...AUTH_USER_SELECT,
  avatarInitial: true,
  avatarUrl: true,
} as const;

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, resolveJwtSecret(), { expiresIn: MAX_AGE });
}

export function verifyToken(token: string): JwtPayload | null {
  // Resolved outside the try so a missing-secret misconfiguration surfaces as a
  // 500 rather than being swallowed into an indistinguishable "invalid token".
  const secret = resolveJwtSecret();
  try {
    return jwt.verify(token, secret) as JwtPayload;
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
  return prisma.user.findUnique({
    where: { id: payload.userId, active: true },
    select: AUTH_USER_SELECT,
  });
}

/** Session profile lookup used only by /auth/me, where avatar data is needed. */
export async function getCurrentUserProfile(req: VercelRequest) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  return prisma.user.findUnique({
    where: { id: payload.userId, active: true },
    select: PROFILE_USER_SELECT,
  });
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

/** Contractor accounts are read-only and scoped to their own contractor. Use this
 *  to lock them out of endpoints/methods they must never reach. Returns true (and
 *  sends 403) when the user is a contractor, so callers do `if (denyContractor(...)) return;`. */
export function denyContractor(
  user: { role: string } | null,
  res: VercelResponse
): boolean {
  if (user?.role === 'contractor') {
    res.status(403).json({ error: 'Not available for contractor accounts.' });
    return true;
  }
  return false;
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
