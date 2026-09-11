import jwt from 'jsonwebtoken';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from './prisma.js';
import { canViewAs, isReadOnlyMethod, requestedViewAsId } from './view-as.js';

// Use || (not ??) so an empty-string env var falls back too — an empty secret
// makes jwt.sign throw "secretOrPrivateKey must have a value" and crashes login.
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
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

/**
 * Verify auth and return the current User from DB, or null.
 *
 * This is also where "view as rep" takes effect, deliberately — it is the one
 * chokepoint every portal endpoint already goes through, so an endpoint cannot
 * forget to honour it, and cannot honour it differently from its neighbour.
 * The returned user IS the rep, so every downstream scope check (including the
 * commission ledger strip) narrows on its own with no per-endpoint change.
 *
 * `viewAsOf` carries the real admin's id, for requireAuth's write block and so
 * anything that needs to know who is really here can ask.
 */
export async function getCurrentUser(req: VercelRequest) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const user = await prisma.user.findUnique({
    where: { id: payload.userId, active: true },
    select: AUTH_USER_SELECT,
  });
  if (!user) return null;

  const viewAsId = requestedViewAsId(req, user);
  if (!viewAsId) return user;

  const target = await prisma.user.findUnique({
    where: { id: viewAsId },
    select: AUTH_USER_SELECT,
  });
  // An unusable target is ignored rather than refused: the admin stays
  // themselves and sees their own portal, which is a confusing-but-safe
  // outcome. Failing the request instead would lock an admin out of the portal
  // over a stale id in their own browser.
  if (!canViewAs(user, target)) return user;

  return { ...target!, viewAsOf: user.id };
}

/**
 * Session profile lookup used only by /auth/me, where avatar data is needed.
 *
 * Honours view-as for the same reason getCurrentUser does: if /auth/me kept
 * reporting the admin while every other endpoint answered as the rep, the
 * portal would render one person's name over another person's data — exactly
 * the confusion this feature exists to avoid.
 */
export async function getCurrentUserProfile(req: VercelRequest) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const user = await prisma.user.findUnique({
    where: { id: payload.userId, active: true },
    select: PROFILE_USER_SELECT,
  });
  if (!user) return null;

  const viewAsId = requestedViewAsId(req, user);
  if (!viewAsId) return user;

  const target = await prisma.user.findUnique({
    where: { id: viewAsId },
    select: PROFILE_USER_SELECT,
  });
  if (!canViewAs(user, target)) return user;

  return { ...target!, viewAsOf: user.id };
}

/** Middleware helper — returns user or sends 401 and returns null. */
export async function requireAuth(req: VercelRequest, res: VercelResponse) {
  const user = await getCurrentUser(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized.' });
    return null;
  }
  // Viewing as a rep is a way of LOOKING, never a way of acting. A write made
  // while viewing would land in the activity log attributed to someone who was
  // not there. Blocked here rather than per-endpoint so nothing can miss it.
  if ('viewAsOf' in user && user.viewAsOf && !isReadOnlyMethod(req.method)) {
    res.status(403).json({
      error: 'Read-only while viewing as another user. Exit the rep view to make changes.',
    });
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
