// Which consultations are asking a rep to do something.
//
// This rule used to exist twice, written out by hand: once on the dashboard to
// build the "Today · Needs attention" list, and once in the portal shell to put
// a count on the Consultations nav badge. The two copies drifted. The badge was
// missing three of the dashboard's conditions — a stale estimate, a stale
// contractor review, and a consultation with nobody assigned — so it could read
// 2 while the list underneath it showed 5, or read nothing at all while real
// work was waiting.
//
// That matters more here than a duplicated filter normally would. Six separate
// commits went into making these alerts believable — retiring the loud red
// "Attention" banner for calm tiered chips, silencing follow-ups on deals
// dragged to Lost, dropping "missing contractor" as a reason to nag, counting
// only submissions that still need a first contact. Every one of those was
// about a rep being able to trust the number. Two copies of the rule quietly
// undid that work, because the number a rep sees first is the one that lies.
//
// So the rule lives here, once, and both callers read it. The dashboard's
// version was the fuller of the two and is what this preserves — nothing that
// used to raise a flag has stopped raising one. The nav badge gains the three
// conditions it was missing, which means the badge count goes UP for anyone
// carrying stale estimates, stale contractor reviews, or unassigned work. That
// is the correction, not a regression: those consultations were always on the
// dashboard's list.
//
// Deliberately NOT included, because each was removed on purpose:
//   · a missing contractor — see "stop flagging missing contractor"
//   · follow-ups on lost deals — see followUps.ts, which this defers to
// Adding either back here would re-break a complaint that is already closed.

import { followUpSilenced } from './followUps';
import type { Appointment } from './types';

/** How many days ago an ISO timestamp was. Blank/unset reads as today. */
export function daysSince(value: string, now: number = Date.now()): number {
  if (!value) return 0;
  return Math.floor((now - new Date(value).getTime()) / 86400000);
}

/** A stage that has sat untouched this long is waiting on someone. */
export const STALE_STAGE_DAYS = 3;

/** The fields the rule actually reads. */
export type AttentionFields = Pick<
  Appointment,
  | 'assignedRepId'
  | 'appointmentDate'
  | 'consultationStage'
  | 'dealId'
  | 'followUpDate'
  | 'homeownerInterestLevel'
  | 'nextStep'
  | 'outcomeSubmitted'
  | 'status'
  | 'updatedAt'
>;

export type AttentionContext = {
  /** Deal ids dragged to Lost — their follow-ups stay quiet. */
  lostDeals: Set<string>;
  /** Toronto-local YYYY-MM-DD. Passed in so "today" is decided in one place. */
  today: string;
  /** Overridable for tests. */
  now?: number;
};

/**
 * Does this consultation need a rep to act?
 *
 * Order is presentation-only — any one condition is enough — but it is kept in
 * the same order the dashboard listed them so the two can be diffed by eye.
 */
export function needsAttention(
  appointment: AttentionFields,
  { lostDeals, today, now = Date.now() }: AttentionContext
): boolean {
  const quiet = followUpSilenced(appointment, lostDeals);
  const stale = (stage: Appointment['consultationStage']) =>
    appointment.consultationStage === stage &&
    daysSince(appointment.updatedAt, now) > STALE_STAGE_DAYS;

  return (
    // Visit happened, nobody wrote up what came of it.
    (appointment.status === 'completed' && !appointment.outcomeSubmitted) ||
    // A follow-up that has come due, unless the deal was given up on.
    (!quiet &&
      appointment.nextStep === 'follow_up_required' &&
      Boolean(appointment.followUpDate) &&
      appointment.followUpDate <= today) ||
    // Interested homeowner with no next step booked — the expensive one to miss.
    (['hot', 'warm'].includes(appointment.homeownerInterestLevel ?? '') &&
      appointment.nextStep === 'no_action') ||
    // The date has passed and it was never closed out.
    (appointment.appointmentDate < today && appointment.status !== 'completed') ||
    (!quiet && appointment.consultationStage === 'follow_up_required') ||
    // Waiting on us, not on the homeowner.
    stale('estimate_requested') ||
    stale('contractor_review') ||
    // Nobody owns it.
    !appointment.assignedRepId
  );
}

/** The same rule over a list — what the nav badge counts. */
export function countNeedsAttention(
  appointments: AttentionFields[],
  context: AttentionContext
): number {
  return appointments.reduce(
    (total, appointment) => (needsAttention(appointment, context) ? total + 1 : total),
    0
  );
}
