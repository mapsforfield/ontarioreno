/**
 * "How did the visit go?" — a push to the REP (never the homeowner) shortly
 * after a consultation's end time, opening the 30-second outcome sheet.
 *
 * Why: the Attention tab held 39 past-due consultations, some from June. Reps
 * were not skipping the outcome on purpose; nothing asked them at the moment
 * they knew the answer, and by evening it was forgotten. The push lands while
 * they are still in the driveway.
 *
 * Runs inside the 15-minute notification drain (GitHub Actions → the live
 * /api/leads?flow=drain endpoint). Each appointment is nudged at most once —
 * `outcomeNudgedAt` is stamped before the push goes out.
 *
 * Pure selection lives here so it can be tested without a database.
 */

export type NudgeCandidate = {
  id: string;
  appointmentDate: string; // YYYY-MM-DD, Toronto
  appointmentTime: string; // HH:MM, Toronto
  durationMinutes: number | null;
  status: string;
  appointmentType: string;
  outcomeSubmitted: boolean;
  outcomeNudgedAt: Date | string | null;
  assignedRepId: string | null;
  deletedAt: Date | string | null;
};

/** Minutes after the scheduled end before we ask — give them time to leave. */
export const NUDGE_DELAY_MINUTES = 15;
/** Past this, the moment has gone; the Attention tab still catches it. */
export const NUDGE_WINDOW_MINUTES = 6 * 60;
/** Never buzz a phone before 8:00 or after 21:30, Toronto time. */
export const QUIET_BEFORE_MINUTES = 8 * 60;
export const QUIET_AFTER_MINUTES = 21 * 60 + 30;

const NUDGEABLE_STATUSES = new Set(['scheduled', 'confirmed', 'completed']);
// Showroom visits, supplier meetings, site checks and custom events have no
// homeowner outcome to log.
const EVENT_TYPES = new Set(['showroom_visit', 'supplier_meeting', 'site_check', 'custom_event']);

function toMinutes(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm ?? '');
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/**
 * Which appointments are due a nudge right now.
 * `todayToronto` is YYYY-MM-DD and `nowMinutesToronto` minutes since midnight,
 * both in America/Toronto.
 */
export function selectOutcomeNudges<T extends NudgeCandidate>(
  candidates: T[],
  todayToronto: string,
  nowMinutesToronto: number
): T[] {
  if (nowMinutesToronto < QUIET_BEFORE_MINUTES || nowMinutesToronto > QUIET_AFTER_MINUTES) {
    return [];
  }
  return candidates.filter((a) => {
    if (a.deletedAt) return false;
    if (a.outcomeSubmitted || a.outcomeNudgedAt) return false;
    if (!a.assignedRepId) return false;
    if (!NUDGEABLE_STATUSES.has(a.status)) return false;
    if (EVENT_TYPES.has(a.appointmentType)) return false;
    if (a.appointmentDate !== todayToronto) return false;
    const start = toMinutes(a.appointmentTime);
    if (start === null) return false;
    const end = start + (a.durationMinutes && a.durationMinutes > 0 ? a.durationMinutes : 60);
    const since = nowMinutesToronto - end;
    return since >= NUDGE_DELAY_MINUTES && since <= NUDGE_WINDOW_MINUTES;
  });
}

/** Today's date and the minute of the day in Ontario. */
export function torontoNow(now: Date = new Date()): { date: string; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
  const hour = Number(get('hour')) % 24; // some runtimes render midnight as 24
  return { date: `${get('year')}-${get('month')}-${get('day')}`, minutes: hour * 60 + Number(get('minute')) };
}

export function outcomeNudgePayload(a: { id: string; customerName?: string | null; title?: string | null }) {
  const who = a.customerName?.trim() || a.title?.trim() || 'your last visit';
  return {
    title: 'How did it go?',
    body: `Log the outcome for ${who} — takes 30 seconds.`,
    url: `/portal/appointments?outcome=${encodeURIComponent(a.id)}`,
    tag: `outcome-${a.id}`,
  };
}
