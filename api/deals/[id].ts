import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../lib/prisma.js';
import { requireAuth } from '../../lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const { id } = req.query as { id: string };

  if (req.method === 'GET') {
    const deal = await prisma.deal.findUnique({
      where: { id },
      include: {
        activity: { orderBy: { createdAt: 'desc' } },
        proposals: { orderBy: { sentAt: 'desc' } },
        dispatches: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!deal) return res.status(404).json({ error: 'Not found.' });
    return res.status(200).json(deal);
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    const { activity, createdAt, updatedAt, id: _id, proposals: _p, dispatches: _d, assignedRepId: _repId, ...data } = req.body;
    void activity; void createdAt; void updatedAt; void _id; void _p; void _d;
    // Only admins may reassign a deal to a different rep
    const safeData = user.role === 'admin' && _repId ? { ...data, assignedRepId: _repId } : data;
    // If estimatedJobValue changed, update the commission record too
    if (safeData.estimatedJobValue !== undefined) {
      const jobValue = Number(safeData.estimatedJobValue);
      const repEst = Math.round(jobValue * 0.05);
      const adminTotalEst = Math.round(jobValue * 0.1);
      await prisma.commission.updateMany({
        where: { dealId: id },
        data: {
          repEstimatedCommission: repEst,
          adminTotalEstimatedCommission: adminTotalEst,
          adminNetCommission: adminTotalEst - repEst,
        },
      }).catch(() => { /* commission may not exist yet */ });
    }
    const deal = await prisma.deal.update({
      where: { id },
      data: safeData,
      include: {
        activity: { orderBy: { createdAt: 'desc' } },
        proposals: { orderBy: { sentAt: 'desc' } },
        dispatches: { orderBy: { createdAt: 'desc' } },
      },
    });
    return res.status(200).json(deal);
  }

  if (req.method === 'POST') {
    const body = req.body as Record<string, unknown>;
    const action = body._action as string | undefined;

    // Legacy: plain note (no _action)
    if (!action || action === 'add_note') {
      const note = body.note as string | undefined;
      if (!note) return res.status(400).json({ error: 'Note is required.' });
      const activityEntry = await prisma.dealActivity.create({
        data: { dealId: id, note },
      });
      return res.status(201).json(activityEntry);
    }

    // Add a proposal history record
    if (action === 'add_proposal') {
      const proposal = await prisma.proposalHistory.create({
        data: {
          dealId: id,
          contractorId: body.contractorId as string,
          templateType: body.templateType as string,
          proposalSubject: body.proposalSubject as string,
          proposalBody: body.proposalBody as string,
          sentAt: (body.sentAt as string) ?? new Date().toISOString(),
          sentByUserId: body.sentByUserId as string,
        },
      });
      return res.status(201).json(proposal);
    }

    // Add a contractor dispatch
    if (action === 'add_dispatch') {
      const dispatch = await prisma.contractorDispatch.create({
        data: {
          dealId: id,
          consultationId: (body.consultationId as string) ?? null,
          contractorId: body.contractorId as string,
          sentByUserId: body.sentByUserId as string,
          sentAt: (body.sentAt as string) ?? new Date().toISOString(),
          status: (body.status as string) ?? 'draft',
          contractorResponseNote: (body.contractorResponseNote as string) ?? '',
          safeSummary: (body.safeSummary as string) ?? '',
          estimatedProjectRange: (body.estimatedProjectRange as string) ?? '',
          financingRequired: (body.financingRequired as boolean) ?? false,
        },
      });
      return res.status(201).json(dispatch);
    }

    // Update a contractor dispatch
    if (action === 'update_dispatch') {
      const dispatchId = body.dispatchId as string;
      if (!dispatchId) return res.status(400).json({ error: 'dispatchId required.' });
      // Strip read-only / relational fields before passing to Prisma
      const { _action: _a, dispatchId: _did, id: _id, dealId: _dlid, createdAt: _ca, updatedAt: _ua, ...safeUpdates } = body;
      void _a; void _did; void _id; void _dlid; void _ca; void _ua;
      const dispatch = await prisma.contractorDispatch.update({
        where: { id: dispatchId },
        data: safeUpdates as Parameters<typeof prisma.contractorDispatch.update>[0]['data'],
      });
      return res.status(200).json(dispatch);
    }

    // Assign contractor from dispatch (marks dispatch accepted, updates deal + appointment)
    if (action === 'assign_dispatch') {
      const dispatchId = body.dispatchId as string;
      if (!dispatchId) return res.status(400).json({ error: 'dispatchId required.' });

      const dispatch = await prisma.contractorDispatch.findUnique({ where: { id: dispatchId } });
      if (!dispatch) return res.status(404).json({ error: 'Dispatch not found.' });

      await prisma.contractorDispatch.update({
        where: { id: dispatchId },
        data: { status: 'accepted', updatedAt: new Date() },
      });

      await prisma.deal.update({
        where: { id },
        data: { assignedContractorId: dispatch.contractorId },
      });

      if (dispatch.consultationId) {
        // Only update consultationStage if it hasn't already been closed (won/lost)
        const appt = await prisma.appointment.findUnique({
          where: { id: dispatch.consultationId },
          select: { consultationStage: true },
        }).catch(() => null);
        const closedStages = ['won', 'lost'];
        await prisma.appointment.update({
          where: { id: dispatch.consultationId },
          data: {
            contractorId: dispatch.contractorId,
            ...(appt && !closedStages.includes(appt.consultationStage)
              ? { consultationStage: 'contractor_accepted' }
              : {}),
          },
        }).catch(() => { /* appointment may not exist */ });
      }

      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Unknown _action.' });
  }

  if (req.method === 'DELETE') {
    if (user.role !== 'admin') return res.status(403).json({ error: 'Admin only.' });
    await prisma.deal.delete({ where: { id } });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
