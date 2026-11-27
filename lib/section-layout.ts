// Per-user section order — each person drags a page's cards into the order
// that makes sense to them, and it is theirs alone.
//
// Stored server-side (Setting row `section_layout:<userId>`) so it follows the
// person to any computer, not just the browser they arranged it in. Shape:
// `{ [page]: sectionId[] }`.
//
// The one property that matters: a saved layout can REORDER sections but can
// never HIDE one. `applySectionOrder` always returns every section the page
// ships with — ids the saved order does not know (a section added after the
// user arranged things) are slotted in next to their default neighbour, and
// ids the page no longer has are dropped. Features have been lost here before
// (CLAUDE.md); a stale preference must not be another way to lose one.

export const SECTION_LAYOUT_PREFIX = 'section_layout:';

export type SectionLayouts = Record<string, string[]>;

const ID = /^[a-z0-9_-]{1,40}$/i;
const MAX_PAGES = 20;
const MAX_SECTIONS = 30;

/** A clean id list: valid ids only, no duplicates, bounded. */
export function cleanSectionOrder(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  for (const value of raw) {
    if (typeof value !== 'string' || !ID.test(value) || seen.has(value)) continue;
    seen.add(value);
    if (seen.size >= MAX_SECTIONS) break;
  }
  return [...seen];
}

/** Parse a stored value (JSON string or object). Anything malformed reads as {}. */
export function parseSectionLayouts(raw: unknown): SectionLayouts {
  let value: unknown = raw;
  if (typeof raw === 'string') {
    try {
      value = JSON.parse(raw);
    } catch {
      return {};
    }
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out: SectionLayouts = {};
  for (const [page, order] of Object.entries(value as Record<string, unknown>)) {
    if (Object.keys(out).length >= MAX_PAGES) break;
    if (!ID.test(page)) continue;
    const clean = cleanSectionOrder(order);
    if (clean.length > 0) out[page] = clean;
  }
  return out;
}

/**
 * The order to render: the saved order, restricted to sections that exist,
 * with every section the saved order is missing put back beside its default
 * predecessor. Always a permutation of `defaults`.
 */
export function applySectionOrder(defaults: readonly string[], saved?: readonly string[] | null): string[] {
  const known = new Set(defaults);
  const result = (saved ?? []).filter((id, i, arr) => known.has(id) && arr.indexOf(id) === i);
  defaults.forEach((id, index) => {
    if (result.includes(id)) return;
    // Find the nearest earlier default that is already placed and go after it.
    let insertAt = 0;
    for (let j = index - 1; j >= 0; j -= 1) {
      const at = result.indexOf(defaults[j]);
      if (at !== -1) {
        insertAt = at + 1;
        break;
      }
    }
    result.splice(insertAt, 0, id);
  });
  return result;
}

/** Move `dragged` to sit before or after `target`. */
export function moveSection(
  order: readonly string[],
  dragged: string,
  target: string,
  place: 'before' | 'after'
): string[] {
  if (dragged === target || !order.includes(dragged) || !order.includes(target)) return [...order];
  const without = order.filter((id) => id !== dragged);
  const at = without.indexOf(target) + (place === 'after' ? 1 : 0);
  without.splice(at, 0, dragged);
  return without;
}
