/** Return a normalized public web URL, or null for missing/unsafe values. */
export function validOfficialSourceUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

type StoredGrantSource = {
  sourceUrl?: unknown;
  sourceUrls?: unknown;
  source?: { url?: unknown } | null;
};

/** Resolve both current and legacy scanner storage without duplicating source data. */
export function officialSourceFromProgram(program: StoredGrantSource): string | null {
  const candidates = [
    program.sourceUrl,
    ...(Array.isArray(program.sourceUrls) ? program.sourceUrls : []),
    program.source?.url,
  ];
  for (const candidate of candidates) {
    const valid = validOfficialSourceUrl(candidate);
    if (valid) return valid;
  }
  return null;
}
