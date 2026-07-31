// ─── Submissions-log predicates ───────────────────────────────────────────────
// Shared so the dashboard badge and the page's "Unworked only" filter cannot
// drift apart. A badge that disagrees with the list it links to is worse than
// no badge.

import type { Lead } from './types';

export function isConsultationSubmission(lead: Lead): boolean {
  return lead.source === 'consultation_flow';
}

/**
 * Outstanding work: nobody has marked it, and it never reached a booking.
 *
 * A submission that booked was handled at the time — an appointment exists and
 * the team alert fired — so counting it as outstanding would overstate the
 * backlog by every historical booking and train people to ignore the number.
 *
 * This narrows a COUNT, never row visibility. Every submission, booked or
 * trashed, still appears in the log; the log hides nothing. Trashed leads are
 * excluded here only because a lead in the bin is not work waiting to be done.
 */
export function isUnworkedSubmission(lead: Lead): boolean {
  return (
    isConsultationSubmission(lead) &&
    !lead.submissionContactedAt &&
    !lead.appointmentId &&
    !lead.deletedAt
  );
}

export function countUnworkedSubmissions(leads: Lead[]): number {
  return leads.filter(isUnworkedSubmission).length;
}
