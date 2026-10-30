// ─── Route planner for a rep's day ───────────────────────────────────────────
// Pure ordering for the Map view: optional START (where the rep is now, or an
// address they typed) → the day's stops → optional END (their home).
//
// Without a start it behaves exactly as the map always did: nearest-neighbour
// from the earliest stop. With a start and/or end, a day is small enough (a
// handful of visits) to try every order and take the shortest; bigger days
// fall back to nearest-neighbour from the start.
//
// Distances are straight-line km. ROAD_FACTOR turns them into a rough driving
// estimate — good enough to compare orders, not a quote. Google Maps has the
// real number.

export type LatLon = { lat: number; lon: number };

export const ROAD_FACTOR = 1.3;
const BRUTE_FORCE_MAX = 7; // 7! = 5040 orders — instant

export function haversineKm(a: LatLon, b: LatLon): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
}

/** Rough road km for a straight-line hop. */
export function roadKm(a: LatLon, b: LatLon): number {
  return haversineKm(a, b) * ROAD_FACTOR;
}

function pathKm<T extends LatLon>(stops: T[], start?: LatLon | null, end?: LatLon | null): number {
  let km = 0;
  let prev: LatLon | null = start ?? null;
  for (const s of stops) {
    if (prev) km += haversineKm(prev, s);
    prev = s;
  }
  if (prev && end) km += haversineKm(prev, end);
  return km;
}

function nearestFrom<T extends LatLon>(from: LatLon | null, stops: T[]): T[] {
  const remaining = [...stops];
  const route: T[] = [];
  let cur = from;
  if (!cur) {
    cur = remaining.shift()!;
    route.push(cur as T);
  }
  while (remaining.length) {
    let bestIdx = 0;
    let bestDist = Infinity;
    remaining.forEach((p, i) => {
      const d = haversineKm(cur!, p);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    });
    cur = remaining.splice(bestIdx, 1)[0];
    route.push(cur as T);
  }
  return route;
}

function* permutations<T>(items: T[]): Generator<T[]> {
  if (items.length <= 1) {
    yield items;
    return;
  }
  for (let i = 0; i < items.length; i++) {
    const rest = [...items.slice(0, i), ...items.slice(i + 1)];
    for (const p of permutations(rest)) yield [items[i], ...p];
  }
}

/**
 * Shortest-drive order of `stops` (already sorted by time — the first is the
 * fallback anchor when there is no start).
 */
export function orderStops<T extends LatLon>(stops: T[], start?: LatLon | null, end?: LatLon | null): T[] {
  if (stops.length <= 1) return [...stops];
  if (!start && !end) return stops.length <= 2 ? [...stops] : nearestFrom(null, stops);
  if (stops.length > BRUTE_FORCE_MAX) return nearestFrom(start ?? null, stops);
  let best: T[] = [...stops];
  let bestKm = pathKm(best, start, end);
  for (const p of permutations(stops)) {
    const km = pathKm(p, start, end);
    if (km < bestKm - 1e-9) {
      best = p;
      bestKm = km;
    }
  }
  return best;
}

export type RouteLeg = { fromLabel: string; toLabel: string; km: number };

/** Leg-by-leg rough road km for an ordered day, including start and home. */
export function routeLegs<T extends LatLon>(
  ordered: T[],
  label: (s: T) => string,
  start?: (LatLon & { label: string }) | null,
  end?: (LatLon & { label: string }) | null
): RouteLeg[] {
  const points: Array<LatLon & { label: string }> = [
    ...(start ? [start] : []),
    ...ordered.map((s) => ({ lat: s.lat, lon: s.lon, label: label(s) })),
    ...(end ? [end] : []),
  ];
  const legs: RouteLeg[] = [];
  for (let i = 1; i < points.length; i++) {
    legs.push({ fromLabel: points[i - 1].label, toLabel: points[i].label, km: roadKm(points[i - 1], points[i]) });
  }
  return legs;
}
