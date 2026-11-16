/**
 * Every booked consultation lands on the pipeline by itself.
 *
 * A deal used to exist only once a rep opened the consultation and pressed
 * "Create deal". Until they did, the homeowner was nowhere on the Deals board —
 * so an admin looking for a deal a rep was actively working would not find
 * it, and "Appointment booked" showed whatever reps had remembered to add
 * rather than what was actually booked.
 *
 * Now every path that creates a consultation calls `ensureDealForAppointment`
 * straight after: the public booking flow, `book_lead`, and portal hand
 * booking. The manual "Create deal" button still works — it simply has
 * nothing to do once a deal is linked (it already bails on `dealId`).
 *
 * Rules:
 * - Never a second deal for the same homeowner. If they already have an OPEN
 *   deal (matched on email, then phone digits), the consultation is linked to
 *   it. A `new_lead` deal moves up to `appointment_booked`; a deal already at
 *   quoted/negotiating is left where it is — a re-visit is not a step back.
 * - Won/lost deals are history, not matches: a returning homeowner gets a
 *   fresh deal.
 * - Events (showroom visit, supplier meeting, …) are not sales and never get
 *   a deal. Nor do cancelled or deleted consultations.
 * - Best-effort. Callers wrap this in try/catch: a failure here must never
 *   lose or fail the booking itself.
 */

export const EVENT_APPOINTMENT_TYPES = ['showroom_visit', 'supplier_meeting', 'site_check', 'custom_event'];
export const OPEN_DEAL_STATUSES = ['new_lead', 'appointment_booked', 'quoted', 'negotiating'];
const NO_DEAL_APPOINTMENT_STATUSES = ['cancelled', 'canceled', 'no_show'];

export type AppointmentForDeal = {
  id: string;
  dealId: string | null;
  deletedAt?: Date | null;
  status: string;
  appointmentType: string;
  customerName: string;
  title?: string | null;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  projectType: string;
  assignedRepId: string;
  contractorId: string | null;
  recommendedContractorId?: string | null;
  clientId?: string | null;
  estimatedProjectValue?: number | null;
  financingNeeded?: boolean | null;
  followUpDate?: string | null;
  appointmentDate: string;
  internalNotes?: string | null;
  notes?: string | null;
};

export type OpenDealCandidate = {
  id: string;
  email: string;
  phone: string;
  status: string;
  homeownerName?: string;
  assignedRepId?: string;
};

/** Whether this consultation should have a deal at all. */
export function appointmentWantsDeal(a: Pick<AppointmentForDeal, 'dealId' | 'deletedAt' | 'status' | 'appointmentType'>): boolean {
  if (a.dealId) return false;
  if (a.deletedAt) return false;
  if (EVENT_APPOINTMENT_TYPES.includes(a.appointmentType)) return false;
  if (NO_DEAL_APPOINTMENT_STATUSES.includes(String(a.status).toLowerCase())) return false;
  return true;
}

const phoneKey = (p: string | null | undefined) => {
  const digits = String(p ?? '').replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : '';
};
const emailKey = (e: string | null | undefined) => String(e ?? '').trim().toLowerCase();
const nameKey = (n: string | null | undefined) => String(n ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

/**
 * The homeowner's existing open deal, if any. Email first, then phone.
 *
 * Name is a last resort, and only for a visit with NO email and NO phone —
 * the follow-up visits reps hand-book from the portal usually carry just a
 * name (Stanley, Akbar and Sarbpreet Gill's second visits all did). Even then
 * it must be the same rep's deal with exactly that name, so two different
 * "Raj"s on two different reps never collide.
 */
export function matchOpenDeal(
  a: Pick<AppointmentForDeal, 'email' | 'phone'> & Partial<Pick<AppointmentForDeal, 'customerName' | 'assignedRepId'>>,
  candidates: OpenDealCandidate[]
): OpenDealCandidate | null {
  const open = candidates.filter((d) => OPEN_DEAL_STATUSES.includes(d.status));
  const email = emailKey(a.email);
  if (email) {
    const hit = open.find((d) => emailKey(d.email) === email);
    if (hit) return hit;
  }
  const phone = phoneKey(a.phone);
  if (phone) {
    const hit = open.find((d) => phoneKey(d.phone) === phone);
    if (hit) return hit;
  }
  const name = nameKey(a.customerName);
  if (!email && !phone && name && a.assignedRepId) {
    const hits = open.filter((d) => d.assignedRepId === a.assignedRepId && nameKey(d.homeownerName) === name);
    // Two open deals with the same name on one rep: ambiguous, make a new one
    // rather than guess.
    if (hits.length === 1) return hits[0];
  }
  return null;
}

/** The deal row a consultation becomes — same fields the "Create deal" button fills. */
export function dealDataFromAppointment(a: AppointmentForDeal) {
  return {
    clientId: a.clientId ?? null,
    homeownerName: a.customerName || a.title || 'Consultation lead',
    phone: a.phone ?? '',
    email: a.email ?? '',
    address: a.address ?? '',
    city: a.city ?? '',
    postalCode: a.postalCode ?? '',
    projectType: a.projectType || 'Consultation',
    estimatedJobValue: a.estimatedProjectValue || 0,
    financingRequired: a.financingNeeded ?? false,
    assignedRepId: a.assignedRepId,
    assignedContractorId: a.recommendedContractorId ?? a.contractorId ?? null,
    status: 'appointment_booked',
    notes: a.internalNotes || a.notes || '',
    nextFollowUpDate: a.followUpDate || a.appointmentDate || '',
  };
}

// `any` on purpose: the slice of the Prisma client this needs, so a test or a
// transaction client can be passed without dragging in generated types.
/* eslint-disable @typescript-eslint/no-explicit-any */
type DealClient = {
  appointment: { findUnique: (args: any) => Promise<any>; update: (args: any) => Promise<any> };
  deal: { findMany: (args: any) => Promise<any[]>; create: (args: any) => Promise<any>; update: (args: any) => Promise<any> };
  commission: { upsert: (args: any) => Promise<any> };
  contractor: { findUnique: (args: any) => Promise<any> };
  user: { findUnique: (args: any) => Promise<any> };
  activity: { create: (args: any) => Promise<any> };
};
/* eslint-enable @typescript-eslint/no-explicit-any */

export type EnsureDealResult =
  | { outcome: 'skipped' }
  | { outcome: 'linked'; dealId: string }
  | { outcome: 'created'; dealId: string };

export async function ensureDealForAppointment(
  db: DealClient,
  appointmentId: string,
  opts: { defaultTotalRate: number }
): Promise<EnsureDealResult> {
  const appointment = (await db.appointment.findUnique({ where: { id: appointmentId } })) as AppointmentForDeal | null;
  if (!appointment || !appointmentWantsDeal(appointment)) return { outcome: 'skipped' };

  const rep = await db.user
    .findUnique({ where: { id: appointment.assignedRepId }, select: { id: true, name: true, role: true } })
    .catch(() => null);
  // Activity.actorUserId has a live foreign key — it must be a real user.
  // The assigned rep is; without one we skip the history row, not the deal.
  const logActivity = async (dealId: string, actionType: string, actionLabel: string, label: string) => {
    if (!rep?.id) return;
    await db.activity
      .create({
        data: {
          actorUserId: rep.id,
          actorName: 'Automatic',
          actorRole: 'system',
          actionType,
          actionLabel,
          entityType: 'deal',
          entityId: dealId,
          entityLabel: label,
          dealId,
          metadata: { appointmentId: appointment.id, appointmentDate: appointment.appointmentDate },
        },
      })
      .catch(() => undefined);
  };

  {
    const candidates = (await db.deal.findMany({
      where: { deletedAt: null, status: { in: OPEN_DEAL_STATUSES } },
      select: { id: true, email: true, phone: true, status: true, homeownerName: true, assignedRepId: true },
    })) as OpenDealCandidate[];
    const existing = matchOpenDeal(appointment, candidates);
    if (existing) {
      await db.appointment.update({ where: { id: appointment.id }, data: { dealId: existing.id } });
      if (existing.status === 'new_lead') {
        await db.deal.update({ where: { id: existing.id }, data: { status: 'appointment_booked' } });
      }
      const label = existing.homeownerName || appointment.customerName;
      await logActivity(
        existing.id,
        'consultation_linked_to_deal',
        `Consultation on ${appointment.appointmentDate} linked automatically: ${label}`,
        label
      );
      return { outcome: 'linked', dealId: existing.id };
    }
  }

  const data = dealDataFromAppointment(appointment);
  const deal = await db.deal.create({ data });

  // Same commission row POST /api/deals writes, so the deal behaves exactly
  // like one made with the button.
  let totalRate = opts.defaultTotalRate;
  if (data.assignedContractorId) {
    const contractor = await db.contractor
      .findUnique({ where: { id: data.assignedContractorId }, select: { commissionRate: true } })
      .catch(() => null);
    if (contractor?.commissionRate != null) totalRate = contractor.commissionRate;
  }
  const repEst = Math.round(data.estimatedJobValue * 0.05);
  const adminTotalEst = Math.round(data.estimatedJobValue * totalRate);
  await db.commission
    .upsert({
      where: { dealId: deal.id },
      update: {},
      create: {
        dealId: deal.id,
        repId: deal.assignedRepId,
        repCommissionRate: 0.05,
        repEstimatedCommission: repEst,
        repPaidCommission: 0,
        payoutStatus: 'pending',
        adminTotalCommissionRate: totalRate,
        adminTotalEstimatedCommission: adminTotalEst,
        adminNetCommission: adminTotalEst - repEst,
      },
    })
    .catch(() => undefined);

  await db.appointment.update({ where: { id: appointment.id }, data: { dealId: deal.id } });
  await logActivity(
    deal.id,
    'deal_created_from_consultation',
    `Deal created automatically when the consultation was booked: ${data.homeownerName}`,
    data.homeownerName
  );
  return { outcome: 'created', dealId: deal.id };
}
