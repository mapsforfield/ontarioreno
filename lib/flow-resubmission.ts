/**
 * Should a consultation-flow submission reuse the homeowner's previous row, or
 * start a new one?
 *
 * The public flow creates the Lead first and fetches the calendar second. When
 * that second call fails the homeowner is left on the contact screen, with an
 * error, next to a button that already worked — so they press it again. Every
 * press created another row in the Submissions log:
 *
 *   Kyrsi  17:39:33  no booking
 *          17:40:22  no booking   (48s later)
 *          20:06:53  no booking   (came back that evening)
 *          20:07:42  BOOKED       (49s later)
 *
 * Four rows, one homeowner, one appointment — and three of them sitting in
 * "Needs contact" for a rep to chase someone who has already booked.
 *
 * Reusing the row is only safe while nothing has happened to it yet. The audit
 * also found people who booked twice, weeks apart (Stanley, Sukeshi) — those
 * are two real jobs and must stay two rows. So the window is short, and any
 * sign that the previous submission has been acted on ends the reuse.
 */

/** How long after a submission a further one is treated as the same attempt. */
export const RESUBMISSION_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

export type PriorSubmission = {
  createdAt: Date;
  /** Set once the flow booked a slot against this lead. */
  appointmentId: string | null;
  /** Moved off 'new' the moment anything is logged against the lead. */
  status: string;
  /** Set when a rep marked it worked in the Submissions log. */
  submissionContactedAt: Date | null;
  deletedAt: Date | null;
};

/**
 * True when `prior` is the same attempt as a submission arriving now, and can
 * therefore be updated in place instead of duplicated.
 *
 * Every "no" here is deliberate:
 *
 * - **Booked.** The appointment is the thing the row exists to record. A later
 *   submission is a second enquiry; overwriting the booked row would rewrite
 *   the answers behind an appointment a rep is about to drive to.
 * - **Touched by a rep.** Once someone has called, or marked it worked, the row
 *   is a record of that work. Silently rewriting it would change what a rep is
 *   looking at while they look at it.
 * - **Trashed.** Deleting it was a decision. Reviving it through a side door
 *   would undo that with nothing in the history to explain it.
 * - **Older than the window.** Long gaps are people coming back, not people
 *   pressing a button twice.
 */
export function isResubmission(prior: PriorSubmission, now: Date): boolean {
  if (prior.appointmentId) return false;
  if (prior.deletedAt) return false;
  if (prior.submissionContactedAt) return false;
  if (prior.status !== 'new') return false;
  const age = now.getTime() - prior.createdAt.getTime();
  // A negative age means clock skew between the row and this request; treat it
  // as inside the window rather than starting a duplicate on a clock problem.
  return age < RESUBMISSION_WINDOW_MS;
}
