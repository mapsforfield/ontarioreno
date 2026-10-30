import test from 'node:test';
import assert from 'node:assert/strict';
import { haversineKm, orderStops, routeLegs, ROAD_FACTOR } from './route-plan.ts';

// Roughly west → east along the lake.
const hamilton = { id: 'ham', lat: 43.2557, lon: -79.8711 };
const burlington = { id: 'bur', lat: 43.3255, lon: -79.799 };
const oakville = { id: 'oak', lat: 43.4675, lon: -79.6877 };
const mississauga = { id: 'mis', lat: 43.589, lon: -79.6441 };
const stCatharines = { lat: 43.1594, lon: -79.2469 };
const toronto = { lat: 43.6532, lon: -79.3832 };

const ids = (xs: Array<{ id: string }>) => xs.map((x) => x.id).join(',');

test('no start and no home: unchanged nearest-first from the earliest stop', () => {
  const day = [oakville, hamilton, mississauga, burlington];
  assert.equal(ids(orderStops(day)), 'oak,mis,bur,ham');
});

test('starting in Toronto runs the day east → west', () => {
  const day = [hamilton, oakville, burlington, mississauga];
  assert.equal(ids(orderStops(day, toronto)), 'mis,oak,bur,ham');
});

test('starting at a friend’s place in St. Catharines runs it west → east', () => {
  const day = [mississauga, oakville, hamilton, burlington];
  assert.equal(ids(orderStops(day, stCatharines)), 'ham,bur,oak,mis');
});

test('home as the end point: the last stop is the one closest to home', () => {
  const day = [hamilton, mississauga, oakville, burlington];
  const out = orderStops(day, stCatharines, toronto);
  assert.equal(out[out.length - 1].id, 'mis');
});

test('legs include the drive out from the start and the drive home', () => {
  const ordered = [hamilton, mississauga];
  const legs = routeLegs(
    ordered,
    (s) => s.id,
    { ...stCatharines, label: 'Start' },
    { ...toronto, label: 'Home' }
  );
  assert.deepEqual(legs.map((l) => `${l.fromLabel}>${l.toLabel}`), ['Start>ham', 'ham>mis', 'mis>Home']);
  assert.ok(Math.abs(legs[2].km - haversineKm(mississauga, toronto) * ROAD_FACTOR) < 1e-9);
});

test('a single stop is returned as-is', () => {
  assert.equal(ids(orderStops([hamilton], toronto, toronto)), 'ham');
});
