/**
 * The city basement guides, grouped by region, for the internal links on
 * /basements and at the foot of each city's basement page.
 *
 * Why this exists: the city pages were linked only from the home page's city
 * picker and /cities. /basements — the main basement page — linked to none of
 * them, and no city page linked to another, so Google saw 36 pages with almost
 * no internal links pointing in. Every href here is checked against App.tsx's
 * routes by lib/basement-city-links.test.ts, so a renamed route fails the
 * build instead of leaving a dead link.
 */
export type BasementCity = {
  name: string;
  region: 'Halton & Hamilton' | 'Peel' | 'Durham' | 'Simcoe';
  /** The city's main basement page. Hamilton has none, so its cost guide stands in. */
  hub: string;
  cost?: string;
};

export const BASEMENT_CITIES: BasementCity[] = [
  { name: 'Hamilton', region: 'Halton & Hamilton', hub: '/basement-renovation-cost-hamilton' },
  { name: 'Burlington', region: 'Halton & Hamilton', hub: '/basement-renovation-burlington', cost: '/basement-renovation-cost-burlington' },
  { name: 'Milton', region: 'Halton & Hamilton', hub: '/basement-renovation-milton', cost: '/basement-renovation-cost-milton' },
  { name: 'Mississauga', region: 'Peel', hub: '/basement-renovation-mississauga', cost: '/basement-renovation-cost-mississauga' },
  { name: 'Brampton', region: 'Peel', hub: '/basement-renovation-brampton', cost: '/basement-renovation-cost-brampton' },
  { name: 'Ajax', region: 'Durham', hub: '/basement-renovation-ajax', cost: '/basement-renovation-cost-ajax' },
  { name: 'Pickering', region: 'Durham', hub: '/basement-renovation-pickering', cost: '/basement-renovation-cost-pickering' },
  { name: 'Whitby', region: 'Durham', hub: '/basement-renovation-whitby', cost: '/basement-renovation-cost-whitby' },
  { name: 'Oshawa', region: 'Durham', hub: '/basement-renovation-oshawa', cost: '/basement-renovation-cost-oshawa' },
  { name: 'Barrie', region: 'Simcoe', hub: '/basement-renovation-barrie' },
];

export const BASEMENT_REGIONS = ['Halton & Hamilton', 'Peel', 'Durham', 'Simcoe'] as const;

/**
 * Every city except `current`, with `current`'s own region first: someone
 * reading the Ajax page is likelier to want Pickering than Barrie.
 */
export function otherBasementCities(current?: string): { region: string; cities: BasementCity[] }[] {
  const self = BASEMENT_CITIES.find((c) => c.name === current);
  const regions = self ? [self.region, ...BASEMENT_REGIONS.filter((r) => r !== self.region)] : [...BASEMENT_REGIONS];
  return regions
    .map((region) => ({ region, cities: BASEMENT_CITIES.filter((c) => c.region === region && c.name !== current) }))
    .filter((g) => g.cities.length > 0);
}
