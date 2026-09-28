import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { FALLBACK_TILES, PRIMARY_TILES, tileProbeProblem, tileProbeScript } from './map-tiles.js';

const img = (bytes: number[], contentType = 'image/png') => ({ ok: true, contentType, bytes: new Uint8Array(bytes) });
const filled = (n: number, seed: number) => Array.from({ length: n }, (_, i) => (i * seed) % 256);

test('two different real tiles pass', () => {
  assert.equal(tileProbeProblem(img(filled(500, 3)), img(filled(600, 7))), null);
});

test('the same image for two places is a placeholder (CARTO watermark / OSM blocked)', () => {
  const same = filled(2049, 5);
  assert.match(tileProbeProblem(img(same), img(same)) ?? '', /placeholder/);
});

test('errors, non-images and empty tiles fail', () => {
  assert.ok(tileProbeProblem({ ...img(filled(500, 3)), ok: false }, img(filled(500, 7))));
  assert.ok(tileProbeProblem(img(filled(500, 3), 'text/html'), img(filled(500, 7))));
  assert.ok(tileProbeProblem(img([1, 2]), img(filled(500, 7))));
});

test('primary and fallback are different operators', () => {
  const host = (p: typeof PRIMARY_TILES) => new URL(p.probe[0]).host;
  assert.notEqual(host(PRIMARY_TILES), host(FALLBACK_TILES));
  for (const p of [PRIMARY_TILES, FALLBACK_TILES]) assert.notEqual(p.probe[0], p.probe[1]);
});

test('the server-rendered hub embeds both providers', () => {
  const js = tileProbeScript();
  for (const p of [PRIMARY_TILES, FALLBACK_TILES]) for (const l of p.layers) assert.ok(js.includes(l.url));
  assert.doesNotThrow(() => new Function('map', 'L', 'fetch', js));
});

// Guard: a tile URL hardcoded anywhere else is a map that skips the fallback
// and the daily check — exactly how the CARTO watermark went unnoticed.
test('no tile URL is hardcoded outside lib/map-tiles.ts', () => {
  const TILE = /\{z\}\/\{[xy]\}\/\{[xy]\}|basemaps\.cartocdn|tile\.openstreetmap|arcgisonline\.com/;
  // The portal's AppointmentsMap is rep-only and predates this file; left alone deliberately.
  const allowed = new Set(['lib/map-tiles.ts', 'lib/map-tiles.test.ts', 'src/portal/components/AppointmentsMap.tsx']);
  const offenders: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(tsx?|jsx?|html)$/.test(name)) {
        const rel = p.split('\\').join('/');
        if (!allowed.has(rel) && TILE.test(readFileSync(p, 'utf8'))) offenders.push(rel);
      }
    }
  };
  for (const d of ['src', 'lib', 'api']) walk(d);
  assert.deepEqual(offenders, []);
});
