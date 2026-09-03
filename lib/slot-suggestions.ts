// ─── Offering a different time, when the one they chose cannot be honoured ────
//
// The calendar-early flow shows times BEFORE it knows where the property is, so
// the same-day travel rules cannot narrow the list and it offers the widest one
// possible. Once the address arrives, one screen before the booking, the real
// answer can be smaller — and a homeowner whose pick did not survive that has
// done nothing wrong and must not be sent back to start again.
//
// This is what is offered instead. It is deliberately tiny and deliberately
// here rather than in the page: the ordering is the part that decides whether
// the swap feels like a repair or like a rejection, and it is worth a test.

export type SuggestionSlot = { date: string; time: string };

/** Minutes since epoch for a slot, for measuring one against another. */
function slotMinutes(s: SuggestionSlot): number {
  return new Date(`${s.date}T${s.time}:00`).getTime() / 60_000;
}

/**
 * The nearest few real times to the one the homeowner already chose.
 *
 * Ordered by distance from their pick in EITHER direction — someone who asked
 * for Sunday morning wants Sunday afternoon before they want next Thursday, and
 * wants either of those before they want a list to read. Earlier and later are
 * treated alike: the day matters more than the direction, and an hour earlier
 * is a better answer than four days later.
 *
 * At most two from any one day, so three suggestions can never all be the same
 * afternoon. A homeowner who cannot do Sunday at all is then still offered
 * something they can say yes to without opening the calendar again.
 */
export function nearestSlots(
  slots: SuggestionSlot[],
  target: SuggestionSlot,
  count = 3
): SuggestionSlot[] {
  const at = slotMinutes(target);
  const ranked = [...slots].sort(
    (a, b) => Math.abs(slotMinutes(a) - at) - Math.abs(slotMinutes(b) - at)
  );
  const picked: SuggestionSlot[] = [];
  const perDay = new Map<string, number>();
  for (const slot of ranked) {
    if (picked.length >= count) break;
    const used = perDay.get(slot.date) ?? 0;
    if (used >= 2) continue;
    perDay.set(slot.date, used + 1);
    picked.push(slot);
  }
  return picked;
}
