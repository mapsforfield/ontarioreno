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
  /**
   * Every start this program offers, and the floor below which a start is not
   * offered to anybody.
   *
   * Sent so a calendar can draw the times it CANNOT offer as well as the ones
   * it can. Showing only the free ones made a busy day look like a short one —
   * a homeowner seeing 10am and 12pm and nothing else reads it as our working
   * hours, not as the rest of the day being booked.
   *
   * The floor is what keeps that honest. A start below `earliestWall` is in the
   * past or inside the lead-time window; it is not taken, and drawing it as
   * taken would be telling a homeowner something untrue about how busy we are.
   * Those are omitted. Anything at or above the floor that is missing from
   * `slots` is genuinely spoken for.
   *
   * Optional: a caller that does not render a grid ignores it entirely.
   */
  slotGrid?: {
    /** The program's fixed daily starts, e.g. ['10:00','12:00',…]. */
    startTimes: string[];
    /** "YYYY-MM-DDTHH:MM" Toronto wall clock — the lead-time floor. */
    earliestWall: string;
  };
};
