/**
 * How the portal matches a typed search against a homeowner.
 *
 * The old Clients search ran the whole query as one substring against each
 * field, and compared phone numbers as raw text. So "deep kumar" missed
 * "Deepkumar Patel" (no space in the name), "kumar patel" missed it too, and a
 * number typed as "236 863 6369" or "+1 (236) 863-6369" missed "2368636369".
 *
 * Now:
 * - Every word of the query must appear somewhere in the record (any field),
 *   so word order and extra spaces no longer matter.
 * - The name is also compared with spaces removed, so "deep kumar" finds
 *   "Deepkumar" and "deepkumar" finds "Deep Kumar".
 * - A query that is mostly digits is matched against the phone's digits only,
 *   with a leading country code 1 ignored on both sides.
 */

const norm = (s: string | null | undefined) => String(s ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
const compact = (s: string | null | undefined) => norm(s).replace(/[^a-z0-9@.]/g, '');
const digitsOf = (s: string | null | undefined) => String(s ?? '').replace(/\D/g, '');
const stripCountryCode = (d: string) => (d.length === 11 && d.startsWith('1') ? d.slice(1) : d);

export type SearchablePerson = {
  name?: string | null;
  phone?: string | null;
  /** Any other text worth matching: email, city, postal code, address, project types… */
  other?: Array<string | null | undefined>;
};

/** True when the query reads as a phone number rather than words. */
export function looksLikePhoneQuery(query: string): boolean {
  const d = digitsOf(query);
  if (d.length < 3) return false;
  // Allow phone punctuation, nothing alphabetic.
  return !/[a-z]/i.test(query);
}

export function matchesPersonSearch(person: SearchablePerson, query: string): boolean {
  const q = norm(query);
  if (!q) return true;

  if (looksLikePhoneQuery(q)) {
    const want = stripCountryCode(digitsOf(q));
    const have = stripCountryCode(digitsOf(person.phone));
    if (want && have.includes(want)) return true;
    // A postal code or street number is also digits — fall through to text.
  }

  const name = norm(person.name);
  const fields = [name, ...(person.other ?? []).map(norm)].filter(Boolean);
  const haystack = fields.join(' \u0000 ');

  // Whole query with spaces removed against the name with spaces removed.
  const qCompact = compact(q);
  if (qCompact && compact(name).includes(qCompact)) return true;

  const words = q.split(' ').filter(Boolean);
  return words.every((w) => {
    if (haystack.includes(w)) return true;
    const wd = digitsOf(w);
    return wd.length >= 3 && digitsOf(person.phone).includes(wd);
  });
}
