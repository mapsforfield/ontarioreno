// Which calendar entries and clients are a contractor's OWN jobs.
//
// A contractor account (PJ at Galaxy) sees the whole sales calendar, so the
// team reads as busy, but anonymised: names and project only. On its own jobs
// it now also gets the homeowner's contact details — phone, email, address —
// because those are customers it is going to build for.
//
// "Own" is decided here, once, for both the calendar and the client list:
//   - an appointment attributed to this contractor, or
//   - one linked to a deal assigned to this contractor, or
//   - one for a client who has a deal assigned to this contractor.
// An appointment explicitly attributed to ANOTHER contractor, or linked to a
// deal assigned to another contractor, is never own — whatever else matches.
// Unassigned work is not own either. When in doubt the answer is no: the
// failure mode to avoid is handing one contractor another's customer.

export type OwnershipDeal = { id: string; clientId: string | null; assignedContractorId: string | null };

export type OwnershipIndex = {
  contractorId: string;
  /** Deal id → its assigned contractor (null = unassigned). Every live deal. */
  dealContractor: Map<string, string | null>;
  /** Clients with at least one deal assigned to this contractor. */
  ownClientIds: Set<string>;
};

export function buildOwnershipIndex(contractorId: string, deals: OwnershipDeal[]): OwnershipIndex {
  const dealContractor = new Map<string, string | null>();
  const ownClientIds = new Set<string>();
  for (const deal of deals) {
    dealContractor.set(deal.id, deal.assignedContractorId);
    if (deal.assignedContractorId === contractorId && deal.clientId) ownClientIds.add(deal.clientId);
  }
  return { contractorId, dealContractor, ownClientIds };
}

export function isOwnAppointment(
  a: { contractorId?: string | null; dealId?: string | null; clientId?: string | null },
  index: OwnershipIndex | null
): boolean {
  if (!index) return false;
  const cid = index.contractorId;
  if (a.contractorId && a.contractorId !== cid) return false;
  const dealOwner = a.dealId ? index.dealContractor.get(a.dealId) : undefined;
  if (dealOwner && dealOwner !== cid) return false;
  if (a.contractorId === cid) return true;
  if (dealOwner === cid) return true;
  return Boolean(a.clientId && index.ownClientIds.has(a.clientId));
}

export function isOwnClient(clientId: string, index: OwnershipIndex | null): boolean {
  return Boolean(index && index.ownClientIds.has(clientId));
}
