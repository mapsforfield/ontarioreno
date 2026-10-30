// ─── Free-text place → coordinates, locked to Ontario ────────────────────────
// Used by the route planner's start/home points. Same rules as the appointment
// geocoder in api/appointments: Nominatim, Canada only, biased to Ontario, and
// any hit outside Ontario rejected (a bare street name otherwise resolves to a
// same-named street in Calgary).

export type GeoPoint = { lat: number; lon: number; label: string };

export function inOntario(lat: number, lon: number): boolean {
  return lat >= 41.5 && lat <= 57 && lon >= -95.5 && lon <= -74;
}

/** Null when nothing in Ontario matched, or the lookup failed. */
export async function geocodeOntario(query: string): Promise<GeoPoint | null> {
  const q = query.trim();
  if (!q) return null;
  // "Ontario" appended so a street-only entry still lands in the province.
  const withProvince = /\bon(tario)?\b/i.test(q) ? q : `${q}, Ontario`;
  for (const candidate of [withProvince, q]) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ca&viewbox=-95.5,41.5,-74,57&q=${encodeURIComponent(candidate)}`;
      const resp = await fetch(url, {
        headers: { 'User-Agent': 'OntarioReno-Portal/1.0 (info@ontarioreno.ca)' },
      });
      if (!resp.ok) continue;
      const json = (await resp.json()) as Array<{ lat: string; lon: string; display_name?: string }>;
      const hit = json[0];
      if (!hit) continue;
      const lat = parseFloat(hit.lat);
      const lon = parseFloat(hit.lon);
      if (Number.isFinite(lat) && Number.isFinite(lon) && inOntario(lat, lon)) {
        return { lat, lon, label: q };
      }
    } catch {
      /* try the next candidate */
    }
    if (candidate === q) break;
  }
  return null;
}
