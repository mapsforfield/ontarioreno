// The shape of the lead-availability response, shared by the API that builds it
// and the portal that renders it.
//
// It lives here rather than in either side because the two must agree about why
// a lead has no times. They disagreed once already: the API returned an empty
// list whether the calendar was full or the lead's program had closed, and the
// portal — having no way to tell — blamed rep availability for both. A rep on
// the phone with a homeowner went to check a calendar that was fine.

import type { Slot } from './scheduling.js';

/**
 * Why a lead has no times, when the reason is not "the calendar is full".
 * Absent from the payload when the calendar really was consulted.
 */
export type SlotBlock =
  | { reason: 'NO_AREA' }
  | { reason: 'NO_REPS' }
  | {
      reason: 'PROGRAM_CLOSED';
      programName: string;
      /** From the closure record — the date we verified it with the city. */
      confirmedOn: string;
    }
  /** Disabled with no closure recorded: not open yet, rather than finished. */
  | { reason: 'PROGRAM_NOT_OPEN'; programName: string };

export type LeadSlotsPayload = {
  slots: Slot[];
  visitMinutes: number;
  blocked?: SlotBlock;
  /**
   * True when the property is in a remote-consultation city, so what is being
   * booked is a call rather than a site visit.
   *
   * Sent because both calendars render copy from it, and a homeowner shown
   * "In-Person Site Visit" for a booking nobody will drive to is the same class
   * of failure as advertising a closed grant. Absent on a blocked payload —
   * there is nothing to describe.
   */
  remoteConsultation?: boolean;
};
