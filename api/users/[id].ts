import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';
import { requireAdmin, requireAuth } from '../../lib/auth.js';
import { withSchema } from '../../lib/schema.js';
import { geocodeOntario } from '../../lib/geocode.js';

// A rep's home, for the route planner's end point. Kept in Setting rather than
// on User so no login query depends on a new column. Readable by that user and
// admins only — never part of SELECT, which any signed-in user can fetch.
const routeHomeKey = (userId: string) => `route_home:${userId}`;
type RouteHome = { address: string; lat: number; lon: number };
function parseRouteHome(value: string | undefined): RouteHome | null {
  try {
    const v = JSON.parse(value ?? '') as Partial<RouteHome>;
    if (typeof v.address === 'string' && typeof v.lat === 'number' && typeof v.lon === 'number') {
      return { address: v.address, lat: v.lat, lon: v.lon };
    }
  } catch { /* unset */ }
  return null;
}

const SELECT = {
  id: true, name: true, email: true, role: true,
  avatarInitial: true, avatarUrl: true, active: true,
} as const;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = req.query['id'] as string;

  if (req.method === 'GET') {
    const user = await requireAuth(req, res);
    if (!user) return;
    if (req.query['_resource'] === 'route_home') {
      if (user.id !== id && user.role !== 'admin') return res.status(403).json({ error: 'Forbidden.' });
      const row = await withSchema(() => prisma.setting.findUnique({ where: { key: routeHomeKey(id) } }));
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({ home: parseRouteHome(row?.value) });
    }
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
        const match = existing.passwordHash
          ? await bcrypt.compare(currentPassword as string, existing.passwordHash)
          : false;
        if (!match) return res.status(400).json({ error: 'Current password is incorrect.' });
      }
      data.passwordHash = await bcrypt.hash(password as string, 10);
    }

    if (Object.keys(data).length === 0) return res.status(400).json({ error: 'No valid fields to update.' });

    const updated = await prisma.user.update({ where: { id }, data, select: SELECT });
    return res.status(200).json(updated);
  }

  // Push subscription management — no new API file needed (_action discriminator)
  if (req.method === 'POST') {
    const authUser = await requireAuth(req, res);
    if (!authUser) return;
    if (authUser.id !== id && authUser.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden.' });
    }

    const { _action, endpoint, p256dh, auth } = req.body ?? {};

    if (_action === 'push_subscribe') {
      if (!endpoint || !p256dh || !auth) {
        return res.status(400).json({ error: 'Missing subscription fields.' });
      }
      await prisma.pushSubscription.upsert({
        where: { endpoint },
        update: { userId: id, p256dh, auth },
        create: { userId: id, endpoint, p256dh, auth },
      });
      return res.status(200).json({ ok: true });
    }

    // Route planner: set (or clear, with an empty address) this user's home.
    if (_action === 'route_home_set') {
      const address = typeof req.body?.address === 'string' ? req.body.address.trim().slice(0, 300) : '';
      if (!address) {
        await withSchema(() => prisma.setting.deleteMany({ where: { key: routeHomeKey(id) } }));
        return res.status(200).json({ home: null });
      }
      const hit = await geocodeOntario(address);
      if (!hit) return res.status(422).json({ error: 'Couldn’t find that address in Ontario.' });
      const home: RouteHome = { address, lat: hit.lat, lon: hit.lon };
      await withSchema(() =>
        prisma.setting.upsert({
          where: { key: routeHomeKey(id) },
          update: { value: JSON.stringify(home) },
          create: { key: routeHomeKey(id), value: JSON.stringify(home) },
        })
      );
      return res.status(200).json({ home });
    }

    // Route planner: a one-off start point ("I'm at a friend's place"). Not saved.
    if (_action === 'geocode_place') {
      const q = typeof req.body?.query === 'string' ? req.body.query.trim().slice(0, 300) : '';
      const hit = q ? await geocodeOntario(q) : null;
      if (!hit) return res.status(422).json({ error: 'Couldn’t find that address in Ontario.' });
      return res.status(200).json({ place: hit });
    }

    if (_action === 'push_unsubscribe') {
      await prisma.pushSubscription.deleteMany({ where: { userId: id } }).catch(() => {});
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Unknown action.' });
  }

  if (req.method === 'DELETE') {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    await prisma.user.update({ where: { id }, data: { active: false } });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
