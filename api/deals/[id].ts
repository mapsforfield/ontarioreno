import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../lib/prisma.js';
import { requireAuth } from '../../lib/auth.js';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { del, issueSignedToken, presignUrl } from '@vercel/blob';

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
    const rawBody = req.body as Record<string, unknown> | null | undefined;
    if (!rawBody || typeof rawBody !== 'object') {
      return res.status(400).json({ error: 'Invalid or missing request body.' });
    }
    const { activity: _act, createdAt: _ca, updatedAt: _ua, id: _id, proposals: _p, dispatches: _d, assignedRepId: _repId, ...data } = rawBody;
    void _act; void _ca; void _ua; void _id; void _p; void _d;
    // Only admins may reassign a deal to a different rep
    const safeData = user.role === 'admin' && _repId ? { ...data, assignedRepId: _repId } : data;
    try {
      const deal = await prisma.deal.update({
        where: { id },
        data: safeData,
        include: {
          activity: { orderBy: { createdAt: 'desc' } },
          proposals: { orderBy: { sentAt: 'desc' } },
          dispatches: { orderBy: { createdAt: 'desc' } },
        },
      });

      // ── Keep the commission record in sync (creates it if missing —
      // some early deals were created before commissions were automatic) ──
      const jobValueChanged = safeData.estimatedJobValue !== undefined;
      const contractorChanged = safeData.assignedContractorId !== undefined;
      if (jobValueChanged || contractorChanged) {
        try {
          const commission = await prisma.commission.findUnique({ where: { dealId: id } });
          const jobValue = deal.estimatedJobValue;
          const repEst = Math.round(jobValue * 0.05);
          // The contractor's negotiated rate locks in at assignment time.
          // Won deals are frozen — reassignment never rewrites a closed payout.
          let totalRate = commission?.adminTotalCommissionRate ?? 0.1;
          const needsRateLookup =
            deal.assignedContractorId &&
            deal.status !== 'won' &&
            (contractorChanged || !commission);
          if (needsRateLookup) {
            const contractor = await prisma.contractor
              .findUnique({
                where: { id: deal.assignedContractorId! },
                select: { commissionRate: true },
              })
              .catch(() => null);
            if (contractor?.commissionRate != null) totalRate = contractor.commissionRate;
          }
          const adminTotalEst = Math.round(jobValue * totalRate);
          const computed = {
            repEstimatedCommission: repEst,
            adminTotalCommissionRate: totalRate,
            adminTotalEstimatedCommission: adminTotalEst,
            adminNetCommission: adminTotalEst - repEst,
          };
          await prisma.commission.upsert({
            where: { dealId: id },
            update: computed,
            create: {
              dealId: id,
              repId: deal.assignedRepId,
              repCommissionRate: 0.05,
              repPaidCommission: 0,
              payoutStatus: 'pending',
              ...computed,
            },
          });
        } catch {
          // commission sync is non-critical
        }
      }

      return res.status(200).json(deal);
    } catch (err) {
      console.error('[deals/[id]] PATCH failed:', err);
      return res.status(500).json({ error: 'Failed to update deal.' });
    }
  }

  if (req.method === 'POST') {
    const body = req.body as Record<string, unknown>;
    const action = body._action as string | undefined;

    // ── Vercel Blob upload handshake (sent by upload() from @vercel/blob/client).
    // The SDK generates its own token request shape — let handleUpload answer it.
    if (body.type === 'blob.generate-client-token' || body.type === 'blob.upload-completed') {
      try {
        const jsonResponse = await handleUpload({
          body: body as unknown as HandleUploadBody,
          request: req,
          token: process.env.BLOB_READ_WRITE_TOKEN,
          onBeforeGenerateToken: async () => ({
            allowedContentTypes: ['application/pdf', 'image/jpeg', 'image/png'],
            maximumSizeInBytes: 20 * 1024 * 1024, // 20 MB
            addRandomSuffix: true,
          }),
          onUploadCompleted: async () => {
            // DB record is created by the client via add_agreement
          },
        });
        return res.status(200).json(jsonResponse);
      } catch (err) {
        console.error('[deals/[id]] blob upload handshake failed:', err);
        return res.status(400).json({ error: 'Upload handshake failed.' });
      }
    }

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

      const updatedDeal = await prisma.deal.update({
        where: { id },
        data: { assignedContractorId: dispatch.contractorId },
      });

      // Lock the contractor's negotiated rate into this deal's commission
      // (won deals are frozen — never rewrite a closed payout)
      if (updatedDeal.status !== 'won') {
        try {
          const contractor = await prisma.contractor.findUnique({
            where: { id: dispatch.contractorId },
            select: { commissionRate: true },
          });
          if (contractor?.commissionRate != null) {
            const jobValue = updatedDeal.estimatedJobValue;
            const repEst = Math.round(jobValue * 0.05);
            const adminTotalEst = Math.round(jobValue * contractor.commissionRate);
            await prisma.commission.updateMany({
              where: { dealId: id },
              data: {
                repEstimatedCommission: repEst,
                adminTotalCommissionRate: contractor.commissionRate,
                adminTotalEstimatedCommission: adminTotalEst,
                adminNetCommission: adminTotalEst - repEst,
              },
            });
          }
        } catch {
          // commission sync is non-critical
        }
      }

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

    // Issue a short-lived signed URL to view/download a private agreement
    if (action === 'agreement_link') {
      if (!body.id) return res.status(400).json({ error: 'Missing id.' });
      const agreement = await prisma.salesAgreement.findUnique({ where: { id: body.id as string } });
      if (!agreement) return res.status(404).json({ error: 'Not found.' });
      const agreementDeal = await prisma.deal.findUnique({
        where: { id: agreement.dealId },
        select: { assignedRepId: true },
      });
      if (user.role !== 'admin' && agreementDeal?.assignedRepId !== user.id) {
        return res.status(403).json({ error: 'Forbidden.' });
      }
      const rwToken = process.env.BLOB_READ_WRITE_TOKEN;
      if (!rwToken) return res.status(500).json({ error: 'Blob storage not configured.' });
      try {
        const pathname = decodeURIComponent(new URL(agreement.url).pathname.replace(/^\//, ''));
        const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes
        const signed = await issueSignedToken({
          token: rwToken,
          operations: ['get'],
          validUntil: expiry,
        });
        const { presignedUrl } = await presignUrl(signed, {
          operation: 'get',
          pathname,
          access: 'private',
          validUntil: expiry,
        });
        return res.status(200).json({ url: presignedUrl });
      } catch (err) {
        console.error('[deals/[id]] agreement_link failed:', err);
        return res.status(500).json({ error: 'Could not create download link.' });
      }
    }

    // Save an uploaded agreement URL to the database
    if (action === 'add_agreement') {
      if (!body.url || !body.fileName) return res.status(400).json({ error: 'url and fileName required.' });
      const agreement = await prisma.salesAgreement.create({
        data: {
          dealId: id,
          fileName: body.fileName as string,
          url: body.url as string,
          uploadedByUserId: user.id,
        },
      });
      return res.status(201).json(agreement);
    }

    // Delete an agreement record (and its blob)
    if (action === 'delete_agreement') {
      if (!body.id) return res.status(400).json({ error: 'Missing id.' });
      const agreement = await prisma.salesAgreement.findUnique({ where: { id: body.id as string } });
      if (!agreement) return res.status(404).json({ error: 'Not found.' });
      // Admins, or the rep the deal is assigned to, may delete an agreement.
      const agreementDeal = await prisma.deal.findUnique({
        where: { id: agreement.dealId },
        select: { assignedRepId: true },
      });
      if (user.role !== 'admin' && agreementDeal?.assignedRepId !== user.id) {
        return res.status(403).json({ error: 'You can only delete agreements on your own deals.' });
      }
      await prisma.salesAgreement.delete({ where: { id: body.id as string } });
      const rwToken = process.env.BLOB_READ_WRITE_TOKEN;
      if (rwToken) {
        await del(agreement.url, { token: rwToken }).catch(() => { /* non-critical */ });
      }
      return res.status(200).json({ ok: true });
    }

    // Restore a soft-deleted deal from the trash bin
    if (action === 'restore_deal') {
      const dealToRestore = await prisma.deal.findUnique({ where: { id }, select: { assignedRepId: true } });
      if (!dealToRestore) return res.status(404).json({ error: 'Deal not found.' });
      if (user.role !== 'admin' && dealToRestore.assignedRepId !== user.id) {
        return res.status(403).json({ error: 'You can only restore your own deals.' });
      }
      const restored = await prisma.deal.update({
        where: { id },
        data: { deletedAt: null },
        include: {
          activity: { orderBy: { createdAt: 'desc' } },
          proposals: { orderBy: { sentAt: 'desc' } },
          dispatches: { orderBy: { createdAt: 'desc' } },
        },
      });
      return res.status(200).json(restored);
    }

    return res.status(400).json({ error: 'Unknown _action.' });
  }

  if (req.method === 'DELETE') {
    // Allow the assigned rep or admin to delete their own deals
    const dealToDelete = await prisma.deal.findUnique({ where: { id }, select: { assignedRepId: true } });
    if (!dealToDelete) return res.status(404).json({ error: 'Deal not found.' });
    if (user.role !== 'admin' && dealToDelete.assignedRepId !== user.id) {
      return res.status(403).json({ error: 'You can only delete your own deals.' });
    }
    // `?purge=1` permanently removes; default is a soft-delete (trash bin).
    if (req.query['purge'] === '1') {
      await prisma.deal.delete({ where: { id } });
      return res.status(200).json({ ok: true, purged: true });
    }
    try {
      await prisma.deal.update({ where: { id }, data: { deletedAt: new Date() } });
    } catch {
      await prisma.$executeRawUnsafe(
        'ALTER TABLE "Deal" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3)'
      );
      await prisma.deal.update({ where: { id }, data: { deletedAt: new Date() } });
    }
    return res.status(200).json({ ok: true, trashed: true });
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
