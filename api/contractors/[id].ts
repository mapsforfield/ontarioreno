import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../lib/prisma.js';
import { requireAuth, denyContractor } from '../../lib/auth.js';
import { withSchema } from '../../lib/schema.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireAuth(req, res);
  if (!user) return;
  if (denyContractor(user, res)) return;

  const { id } = req.query as { id: string };
  // Finance partners share this route (see api/contractors/index.ts) — here the
  // id is a FinancePartner id rather than a contractor id.
  const isFinancePartner = req.query['_resource'] === 'finance_partners';

  if (isFinancePartner) {
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only.' });
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      const { createdAt, updatedAt, id: _id, ...data } = req.body;
      void createdAt; void updatedAt; void _id;
      const partner = await withSchema(() =>
        prisma.financePartner.update({ where: { id }, data })
      );
      return res.status(200).json(partner);
    }

    if (req.method === 'DELETE') {
      // Drop the partner from every contractor that referenced it, so no card
      // renders a dangling logo.
      await withSchema(async () => {
        const linked = await prisma.contractor.findMany({
          where: { financePartnerIds: { has: id } },
          select: { id: true, financePartnerIds: true },
        });
        for (const contractor of linked) {
          await prisma.contractor.update({
            where: { id: contractor.id },
            data: {
              financePartnerIds: contractor.financePartnerIds.filter(
                (partnerId) => partnerId !== id
              ),
            },
          });
        }
        await prisma.financePartner.delete({ where: { id } });
      });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed.' });
  }

  if (req.method === 'GET') {
    const contractor = await prisma.contractor.findUnique({ where: { id } });
    if (!contractor) return res.status(404).json({ error: 'Not found.' });
    if (user.role !== 'admin') {
      // commissionRate is confidential — only admins ever receive it
      const { commissionRate, ...safe } = contractor;
      void commissionRate;
      return res.status(200).json(safe);
    }
    return res.status(200).json(contractor);
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only.' });
    }
    const { createdAt, updatedAt, id: _id, commissionRate: rawRate, ...data } = req.body;
    void createdAt; void updatedAt; void _id;
    const rate = Number(rawRate);
    const safeData = {
      ...data,
      ...(rawRate !== undefined && Number.isFinite(rate)
        ? { commissionRate: Math.min(Math.max(rate, 0), 1) }
        : {}),
    };
    const contractor = await withSchema(() =>
      prisma.contractor.update({ where: { id }, data: safeData })
    );
    return res.status(200).json(contractor);
  }

  if (req.method === 'DELETE') {
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only.' });
    }
    await prisma.contractor.delete({ where: { id } });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
