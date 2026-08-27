/**
 * Everything already on file for a homeowner, for seeding a NEW consultation's
 * internal notes. See the header of `lib/consultation-notes.ts` for why.
 *
 * Matched on email first (the identity the client auto-upsert already uses),
 * then phone, so a repeat customer who booked with a different address is
 * still recognised. Read-only and best-effort: a lookup failure must never be
 * the reason a booking fails, so callers get '' back.
 */
type NotesLookupClient = {
  client: {
    findFirst: (args: unknown) => Promise<{ internalNotes: string | null } | null>;
  };
  appointment: {
    findFirst: (args: unknown) => Promise<{ internalNotes: string | null; notes: string | null } | null>;
  };
};

export async function priorNotesForHomeowner(
  db: NotesLookupClient,
  identity: { email?: string | null; phone?: string | null; excludeAppointmentId?: string | null }
): Promise<string> {
  const email = identity.email?.trim() || '';
  const phone = identity.phone?.trim() || '';
  if (!email && !phone) return '';
  const match = [
    ...(email ? [{ email }] : []),
    ...(phone ? [{ phone }] : []),
  ];

  try {
    // The client profile is the accumulating blob, so it is the best single
    // source. Fall back to the most recent earlier consultation when the
    // homeowner has no profile yet (the public flow links one after booking).
    const client = await db.client.findFirst({
      where: { OR: match, deletedAt: null },
      select: { internalNotes: true },
      orderBy: { updatedAt: 'desc' },
    } as unknown);
    const fromClient = client?.internalNotes?.trim() ?? '';
    if (fromClient) return fromClient;

    const previous = await db.appointment.findFirst({
      where: {
        OR: match,
        deletedAt: null,
        ...(identity.excludeAppointmentId ? { id: { not: identity.excludeAppointmentId } } : {}),
      },
      select: { internalNotes: true, notes: true },
      orderBy: [{ appointmentDate: 'desc' }, { createdAt: 'desc' }],
    } as unknown);
    return (previous?.internalNotes || previous?.notes || '').trim();
  } catch {
    return '';
  }
}
