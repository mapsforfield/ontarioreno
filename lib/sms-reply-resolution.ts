/**
 * When does a rep's edit resolve an outstanding "wants to move" chip?
 *
 * `smsReplyStatus` is deliberately separate from `status` (see the header of
 * lib/sms-inbound.ts): a homeowner asking to reschedule by text is work for a
 * rep, not a change to the booking, so the inbound handler stamps the chip and
 * leaves the booking's lifecycle alone.
 *
 * What was missing is the other half — nothing ever took the chip back down.
 * A rep who phoned the homeowner, settled it, and set the status by hand was
 * left staring at an amber "Wants to move" badge on a call they had already
 * handled, for the life of the row. A flag that only ever goes up stops meaning
 * anything, and a rep scanning tomorrow cannot tell the settled ones from the
 * live ones.
 *
 * So a rep resolves it by doing either of the two things that end the request:
 *
 *   - changing `status` — they spoke to the homeowner and recorded the outcome
 *     (kept it: 'confirmed'; dropped it: 'cancelled'; either way it is handled)
 *   - moving `appointmentDate` / `appointmentTime` — the move they asked for
 *     actually happened
 *
 * Everything else leaves the chip up. Editing notes, assigning a rep, linking a
 * deal — none of those are answers to "can we move this?", and an open request
 * must survive a rep typing a note against the same appointment.
 *
 * `smsReplyBody` and `smsReplyAt` are NOT cleared by the caller: what the
 * homeowner actually wrote is history, and the reason the rep called. Only the
 * open-work flag comes down.
 */

/** The chip's "wants to move" state, as stamped by lib/sms-inbound.ts. */
export const RESCHEDULE_REQUESTED = 'reschedule_requested';

export type ReplyResolutionBefore = {
  smsReplyStatus?: string | null;
  status?: string | null;
  appointmentDate?: string | null;
  appointmentTime?: string | null;
};

/**
 * Does this update resolve an outstanding reschedule request?
 *
 * `updates` is the raw PATCH body: a field that is `undefined` was not sent at
 * all and cannot have changed. A field sent with the value it already had is
 * not a change either — re-saving a details panel without touching the status
 * dropdown must not silently clear the chip.
 */
export function resolvesRescheduleRequest(
  before: ReplyResolutionBefore | null | undefined,
  updates: Record<string, unknown>
): boolean {
  if (!before) return false;
  if (before.smsReplyStatus !== RESCHEDULE_REQUESTED) return false;

  // An explicit smsReplyStatus in the payload wins — a caller saying what the
  // flag should be is not something to second-guess.
  if (updates['smsReplyStatus'] !== undefined) return false;

  const changed = (field: keyof ReplyResolutionBefore) =>
    updates[field] !== undefined && updates[field] !== (before[field] ?? '');

  return changed('status') || changed('appointmentDate') || changed('appointmentTime');
}
