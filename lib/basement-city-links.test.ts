import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { BASEMENT_CITIES, otherBasementCities } from '../src/lib/basementCities.js';

// The marketing routes App.tsx actually serves.
const app = fs.readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const routes = new Set([...app.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => '/' + m[1].replace(/^\/+/, '')));

test('every city basement link points at a real route', () => {
  for (const c of BASEMENT_CITIES) {
    assert.ok(routes.has(c.hub), `${c.name} hub ${c.hub} is not a route in App.tsx`);
    if (c.cost) assert.ok(routes.has(c.cost), `${c.name} cost ${c.cost} is not a route in App.tsx`);
  }
});

test('every city basement page in App.tsx is in the link list', () => {
  // A new /basement-renovation-<city> page should not be born orphaned.
  const hubs = new Set(BASEMENT_CITIES.map((c) => c.hub));
  for (const r of routes) {
    if (/^\/basement-renovation-(?!cost-)[a-z-]+$/.test(r)) assert.ok(hubs.has(r), `${r} is missing from BASEMENT_CITIES`);
  }
});

test('a city page leaves itself out and leads with its own region', () => {
  const groups = otherBasementCities('Ajax');
  assert.equal(groups[0].region, 'Durham');
  assert.deepEqual(groups[0].cities.map((c) => c.name), ['Pickering', 'Whitby', 'Oshawa']);
  assert.ok(groups.every((g) => g.cities.every((c) => c.name !== 'Ajax')));
});

test('the hub page shows every city', () => {
  const all = otherBasementCities().flatMap((g) => g.cities);
  assert.equal(all.length, BASEMENT_CITIES.length);
});

test('a region left empty by the current city is dropped, not shown as a bare heading', () => {
  assert.ok(otherBasementCities('Barrie').every((g) => g.region !== 'Simcoe'));
});
