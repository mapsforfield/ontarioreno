/**
 * Should a NEW form fill that matched an EXISTING lead still get the first text?
 *
 * The Meta intake only texted newly created leads, so a merge was read as "we
 * already knew this person, so they already had this text". True for Meta's
 * webhook retries, false for a homeowner who comes back weeks later through a
 * fresh ad form. Nekiya Osman (first seen 31 Aug 2026, texted only in a bulk
 * campaign) filled the basement form on 23 Nov 2026 and got nothing.
 *
 * A returning lead gets the opener only when every one of these holds:
 * - the fill itself is fresh (dated within FRESH_FILL_MS), so a sheet re-sync of
 *   old rows can never text anybody;
 * - the lead is older than RETRY_WINDOW_MS, so a webhook retry or double post of
 *   the same fill is still a plain merge;
 * - the lead is still `new`: nobody has worked or dispositioned it;
 * - it has a phone, no call thread, and has never had the lead_welcome text
 *   (whose idempotency key is per lead, so it can only ever send once).
 */
export const FRESH_FILL_MS = 48 * 60 * 60 * 1000;
export const RETRY_WINDOW_MS = 24 * 60 * 60 * 1000;

export interface ReturningLeadFacts {
  status: string | null | undefined;
  phone: string | null | undefined;
  createdAt: Date;
  /** created_time of the incoming form fill, if the sender gave one. */
  fillAt: Date | null;
  hasConversation: boolean;
  hadWelcome: boolean;
  now: Date;
}

export function shouldWelcomeReturningLead(f: ReturningLeadFacts): boolean {
  if (!f.fillAt || Number.isNaN(f.fillAt.getTime())) return false;
  const now = f.now.getTime();
  if (now - f.fillAt.getTime() > FRESH_FILL_MS) return false;
  if (now - f.createdAt.getTime() < RETRY_WINDOW_MS) return false;
  if ((f.status ?? 'new') !== 'new') return false;
  if (!f.phone?.trim()) return false;
  if (f.hasConversation || f.hadWelcome) return false;
  return true;
}
