// Who is allowed to read which commission rows.
//
// A Commission carries both ledgers: the rep's 5% and the admin's net, which
// is the total commission less that 5%. Hand a rep the admin net and they can
// add their own cut back on and recover the total rate and the house's margin
// — on the first deal this came up on, $2,748 beside the rep's own $3,927 is
// $6,675, which is 8.5% of the job.
//
// The portal never rendered the admin's net to a rep, but /api/commissions
// returned every row to every logged-in user, so it sat in the network
// response for anyone who opened devtools. A rule the UI keeps and the API
// does not is not a rule.
//
// So the scope is decided here, server-side, and the client is not trusted to
// filter. Admins read everything; everyone else reads only the rows where they
// are the rep. Contractors never reach this — they are refused earlier.

export type CommissionScope = Record<string, never> | { repId: string };

/**
 * The Prisma `where` clause for a commission read by this user.
 *
 * An empty object means unrestricted, which is what Prisma expects for "no
 * filter" — hence the deliberate Record<string, never> rather than null, so a
 * caller can always spread it into a query without a branch.
 */
export function commissionScopeFor(user: { id: string; role: string }): CommissionScope {
  if (user.role === 'admin') return {};
  return { repId: user.id };
}

/** Can this user read this particular commission row? */
export function canReadCommission(
  user: { id: string; role: string },
  commission: { repId: string }
): boolean {
  return user.role === 'admin' || commission.repId === user.id;
}

// ─── Field-level scope ───────────────────────────────────────────────────────

/**
 * The fields on a Commission that describe the HOUSE's side of the deal.
 *
 * Row-level scoping is not enough on its own. A rep's own commission row still
 * carries the total rate (0.085), the total commission, and the net — so after
 * scoping the list to their own rows, a rep reading the network response still
 * had the whole arrangement. `adminTotalCommissionRate` is the rate itself; the
 * other three each give it back when divided by the job value or added to the
 * rep's own 5%.
 *
 * Kept as a list rather than three property deletes so that adding a field to
 * the admin ledger is a one-line change here, and so the test can assert the
 * list is actually empty on a rep's payload.
 */
export const ADMIN_LEDGER_FIELDS = [
  'adminTotalCommissionRate',
  'adminTotalEstimatedCommission',
  'adminNetCommission',
  'adminNetPaidCommission',
] as const;

/**
 * Remove the house's side of a commission unless the reader is an admin.
 *
 * The fields are DELETED, not zeroed — a zero is a value a reader can mistake
 * for real data, and it still says "this field exists and you are being shown
 * something". Absent is unambiguous. Mirrors how api/contractors already
 * handles the confidential `commissionRate`.
 */
export function stripAdminLedger<T extends Record<string, unknown>>(
  user: { role: string },
  commission: T
): T {
  if (user.role === 'admin') return commission;
  const safe = { ...commission };
  for (const field of ADMIN_LEDGER_FIELDS) delete safe[field];
  return safe;
}
