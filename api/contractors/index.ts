import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../lib/prisma.js';
import { requireAuth } from '../../lib/auth.js';

/** commissionRate is confidential — only admins ever receive it. */
function stripRate<T extends { commissionRate?: number }>(
  contractor: T,
  role: string
): Omit<T, 'commissionRate'> | T {
  if (role === 'admin') return contractor;
  const { commissionRate, ...safe } = contractor;
  void commissionRate;
  return safe;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    let contractors;
    try {
      contractors = await prisma.contractor.findMany({
        orderBy: { companyName: 'asc' },
      });
    } catch {
      // Self-healing migration: the commissionRate column may not exist yet
      // (schema can't be pushed from local env — DB credentials live only in
      // the Neon integration). Idempotent, runs at most once.
      await prisma.$executeRawUnsafe(
        'ALTER TABLE "Contractor" ADD COLUMN IF NOT EXISTS "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.085, ADD COLUMN IF NOT EXISTS "address" TEXT, ADD COLUMN IF NOT EXISTS "city" TEXT, ADD COLUMN IF NOT EXISTS "province" TEXT, ADD COLUMN IF NOT EXISTS "postalCode" TEXT'
      );
      contractors = await prisma.contractor.findMany({
        orderBy: { companyName: 'asc' },
      });
    }
    return res.status(200).json(contractors.map((c) => stripRate(c, user.role)));
  }

  if (req.method === 'POST') {
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only.' });
    }
    const data = req.body;
    const rate = Number(data.commissionRate);
    const contractor = await prisma.contractor.create({
      data: {
        companyName: data.companyName,
        contactName: data.contactName ?? '',
        phone: data.phone ?? '',
        email: data.email ?? '',
        website: data.website ?? '',
        logoUrl: data.logoUrl ?? null,
        publicCompanyName: data.publicCompanyName ?? null,
        publicPhone: data.publicPhone ?? null,
        publicEmail: data.publicEmail ?? null,
        publicWebsite: data.publicWebsite ?? null,
        emailFooterText: data.emailFooterText ?? null,
        financingStatus: data.financingStatus ?? 'cash_only',
        contractorStatus: data.contractorStatus ?? 'pending',
        serviceAreas: data.serviceAreas ?? [],
        projectTypes: data.projectTypes ?? [],
        averageProjectSize: data.averageProjectSize ?? 0,
        notes: data.notes ?? '',
        priorityScore: data.priorityScore ?? 0,
        address: data.address ?? null,
        city: data.city ?? null,
        province: data.province ?? null,
        postalCode: data.postalCode ?? null,
        commissionRate: Number.isFinite(rate) ? Math.min(Math.max(rate, 0), 1) : 0.085,
      },
    });
    return res.status(201).json(contractor);
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
