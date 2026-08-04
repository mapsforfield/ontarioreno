import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../lib/prisma.js';
import { requireAuth, denyContractor } from '../../lib/auth.js';
import { withSchema } from '../../lib/schema.js';

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
  if (denyContractor(user, res)) return;

  // Finance partners (the lenders contractors run financing through) live on
  // this route so the portal loads them alongside the contractors that
  // reference them, instead of paying for another top-level fetch.
  const isFinancePartners = req.query['_resource'] === 'finance_partners';

  if (req.method === 'GET') {
    if (isFinancePartners) {
      const partners = await withSchema(() =>
        prisma.financePartner.findMany({
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        })
      );
      return res.status(200).json(partners);
    }

    const contractors = await withSchema(() =>
      prisma.contractor.findMany({ orderBy: { companyName: 'asc' } })
    );
    return res.status(200).json(contractors.map((c) => stripRate(c, user.role)));
  }

  if (req.method === 'POST') {
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only.' });
    }
    const data = req.body;

    if (isFinancePartners) {
      const name = String(data.name ?? '').trim();
      if (!name) return res.status(400).json({ error: 'Name is required.' });
      const partner = await withSchema(() =>
        prisma.financePartner.create({
          data: {
            name,
            logoUrl: data.logoUrl || null,
            website: data.website ?? '',
            notes: data.notes ?? '',
            active: data.active ?? true,
            sortOrder: Number(data.sortOrder) || 0,
          },
        })
      );
      return res.status(201).json(partner);
    }

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
        financePartnerIds: data.financePartnerIds ?? [],
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
