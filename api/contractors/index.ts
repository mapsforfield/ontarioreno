import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../_lib/prisma.js';
import { requireAuth } from '../_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    const contractors = await prisma.contractor.findMany({
      orderBy: { companyName: 'asc' },
    });
    return res.status(200).json(contractors);
  }

  if (req.method === 'POST') {
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only.' });
    }
    const data = req.body;
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
      },
    });
    return res.status(201).json(contractor);
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
