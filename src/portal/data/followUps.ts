// Which follow-up reminders a rep should still be shown.
//
// A follow-up lives on the APPOINTMENT (`followUpDate`, `nextStep`,
// `consultationStage`) while the decision to stop chasing is made on the DEAL,
// by dragging it to Lost in the pipeline. Nothing connected the two, so a rep
// who closed a deal out kept getting reminded to follow it up — on the
// Consultations badge, on the dashboard agenda, and in the attention list — for
// as long as the appointment row existed. There was no way to make it stop
// short of editing the consultation record itself.
//
// So the reminder is silenced by the deal's status at read time rather than by
// clearing the appointment's fields. The follow-up date is a record of what was
// planned and stays on the consultation where a rep can still see it; only the
// nagging stops. It also means the reps' existing backlog goes quiet the moment
// this ships, with nothing to migrate — and reopening a deal out of Lost brings
// its follow-up back by itself.
//
// Deliberately narrow: only a LOST outcome silences anything, and it silences
// only follow-up reminders. A won deal can still owe someone a call, and a
// missing outcome or an unassigned rep on a lost deal is a gap in our own
// records that a rep should still be shown.

import type { Appointment, Deal } from './types';

/** Deal ids whose follow-up reminders should no longer be raised. */
export function lostDealIds(deals: Deal[]): Set<string> {
  return new Set(deals.filter((deal) => deal.status === 'lost').map((deal) => deal.id));
}

/**
 * True when this appointment's follow-up reminders should stay quiet.
 *
 * The appointment's OWN lost outcome counts too, not just the linked deal's:
 * it is the same call by the same rep, and plenty of consultations never got a
 * deal row to drag anywhere.
 */
export function followUpSilenced(
  appointment: Pick<Appointment, 'dealId' | 'consultationStage' | 'nextStep'>,
  lostDeals: Set<string>
): boolean {
  if (appointment.dealId && lostDeals.has(appointment.dealId)) return true;
  return appointment.consultationStage === 'lost' || appointment.nextStep === 'lost';
}
