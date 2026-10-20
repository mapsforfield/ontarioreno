/**
 * Why a deal was lost — asked once, with one tap, whenever a deal (or a
 * consultation outcome) moves to Lost.
 *
 * With ~70 lost deals against a 36% win rate there was no record of WHY, so
 * nothing could be learned from them. Keys are stored, labels are shown; keep
 * keys stable once they are in the database (rename the label, not the key).
 */

export const LOST_REASONS = [
  { key: 'price', label: 'Price too high' },
  { key: 'competitor', label: 'Went with someone else' },
  { key: 'timing', label: 'Not ready / timing' },
  { key: 'financing', label: "Financing didn't work" },
  { key: 'not_eligible', label: "Didn't qualify for the program" },
  { key: 'no_response', label: 'Stopped responding' },
  { key: 'other', label: 'Other' },
] as const;

export type LostReasonKey = (typeof LOST_REASONS)[number]['key'];

export function isLostReason(value: unknown): value is LostReasonKey {
  return typeof value === 'string' && LOST_REASONS.some((r) => r.key === value);
}

export function lostReasonLabel(key: string | null | undefined): string {
  if (!key) return 'No reason given';
  return LOST_REASONS.find((r) => r.key === key)?.label ?? key;
}

/**
 * Count lost deals by reason, most common first. Deals with no reason are
 * counted under `null` so the summary can say how many were never answered
 * rather than pretending the known reasons are the whole picture.
 */
export function summarizeLostReasons(
  deals: Array<{ status: string; lostReason?: string | null }>
): Array<{ key: LostReasonKey | null; label: string; count: number }> {
  const counts = new Map<LostReasonKey | null, number>();
  for (const d of deals) {
    if (d.status !== 'lost') continue;
    const key = isLostReason(d.lostReason) ? d.lostReason : null;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([key, count]) => ({ key, label: lostReasonLabel(key), count }))
    .sort((a, b) => {
      // Unanswered always last, whatever its size.
      if (a.key === null) return 1;
      if (b.key === null) return -1;
      return b.count - a.count;
    });
}
