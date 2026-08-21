// ─── What the daily emails are allowed to talk about ──────────────────────────
// The follow-up digest and the daily recap each build their own Prisma filter,
// inline, in the middle of a large handler. They drifted: the open-pipeline
// query excluded trashed rows and the two beside it did not, so a rep kept
// getting "follow-up overdue" mail about a deal he had put in the bin weeks
// earlier — and, having binned it, had no way to make the mail stop.
//
// The filters live here so the rule is written once and can be asserted on.
// They are plain objects handed straight to Prisma, not a query layer.

/** Statuses that still want a rep's attention. `lost` and `won` are finished. */
export const OPEN_DEAL_STATUSES = [
  'new_lead',
  'appointment_booked',
  'quoted',
  'negotiating',
] as const;

/** Open statuses as the recap counts them — it also includes `contacted`. */
export const PIPELINE_DEAL_STATUSES = [
  'new_lead',
  'contacted',
  'appointment_booked',
  'quoted',
  'negotiating',
] as const;

/**
 * Deals whose follow-up is due or overdue, for the daily digest.
 *
 * `deletedAt: null` is the point of this function. A soft-deleted deal is one
 * somebody deliberately took out of their pipeline; mailing them about it every
 * morning tells them the system did not listen. It is also unfixable from their
 * side — the deal is already in the bin, so there is nothing left to click.
 *
 * `isHistorical` stays excluded for the original reason: imported pre-portal
 * deals carry follow-up dates from a previous life.
 */
export function followUpDigestWhere(today: string) {
  return {
    nextFollowUpDate: { lte: today, gt: '' },
    status: { in: [...OPEN_DEAL_STATUSES] },
    isHistorical: false,
    deletedAt: null,
  };
}

/** Deals won since `since`, for the recap's "closed today" line. */
export function wonDealsWhere(since: Date) {
  return {
    status: 'won',
    isHistorical: false,
    updatedAt: { gte: since },
    // A won deal that was then binned was binned for a reason — a duplicate,
    // or a mistake. Counting it inflates the day's numbers.
    deletedAt: null,
  };
}

/** Everything still open, for the recap's pipeline total. */
export function openPipelineWhere() {
  return {
    status: { in: [...PIPELINE_DEAL_STATUSES] },
    isHistorical: false,
    deletedAt: null,
  };
}

/** Appointments in a date window, for the recap's visit counts. */
export function recapAppointmentsWhere(fromDate: string, toDate: string) {
  return {
    appointmentDate: { gte: fromDate, lte: toDate },
    deletedAt: null,
  };
}
