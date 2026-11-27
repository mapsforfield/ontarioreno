import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  applySectionOrder,
  cleanSectionOrder,
  moveSection,
  parseSectionLayouts,
} from './section-layout.js';

const DEFAULTS = ['agenda', 'upcoming', 'lifecycle', 'calendar', 'schedule'];

test('no saved order renders the defaults', () => {
  assert.deepEqual(applySectionOrder(DEFAULTS, undefined), DEFAULTS);
  assert.deepEqual(applySectionOrder(DEFAULTS, []), DEFAULTS);
});

test('a saved order is honoured', () => {
  const saved = ['calendar', 'lifecycle', 'agenda', 'upcoming', 'schedule'];
  assert.deepEqual(applySectionOrder(DEFAULTS, saved), saved);
});

test('a saved layout can never hide a section: missing ids come back beside their default neighbour', () => {
  // Saved before `lifecycle` existed on the page.
  const saved = ['calendar', 'agenda', 'upcoming', 'schedule'];
  const out = applySectionOrder(DEFAULTS, saved);
  assert.equal(out.length, DEFAULTS.length);
  assert.deepEqual([...out].sort(), [...DEFAULTS].sort());
  assert.deepEqual(out, ['calendar', 'agenda', 'upcoming', 'lifecycle', 'schedule']);
});

test('a missing first section goes to the top', () => {
  assert.deepEqual(applySectionOrder(DEFAULTS, ['upcoming', 'lifecycle', 'calendar', 'schedule']), DEFAULTS);
});

test('ids the page no longer has are dropped, duplicates ignored', () => {
  const out = applySectionOrder(DEFAULTS, ['gone', 'calendar', 'calendar', 'agenda']);
  // schedule's default neighbour is calendar, so it lands right after it.
  assert.deepEqual(out, ['calendar', 'schedule', 'agenda', 'upcoming', 'lifecycle']);
});

test('moveSection places before / after the target', () => {
  assert.deepEqual(moveSection(DEFAULTS, 'lifecycle', 'calendar', 'before'), DEFAULTS);
  assert.deepEqual(moveSection(DEFAULTS, 'lifecycle', 'agenda', 'before'), ['lifecycle', 'agenda', 'upcoming', 'calendar', 'schedule']);
  assert.deepEqual(moveSection(DEFAULTS, 'agenda', 'schedule', 'after'), ['upcoming', 'lifecycle', 'calendar', 'schedule', 'agenda']);
  assert.deepEqual(moveSection(DEFAULTS, 'agenda', 'agenda', 'after'), DEFAULTS);
  assert.deepEqual(moveSection(DEFAULTS, 'nope', 'agenda', 'after'), DEFAULTS);
});

test('stored values are sanitised', () => {
  assert.deepEqual(parseSectionLayouts('not json'), {});
  assert.deepEqual(parseSectionLayouts(null), {});
  assert.deepEqual(parseSectionLayouts('[1,2]'), {});
  assert.deepEqual(
    parseSectionLayouts(JSON.stringify({ consultations: ['a', 'a', 'b', 5, '<script>'], 'bad page!': ['x'] })),
    { consultations: ['a', 'b'] }
  );
  assert.equal(cleanSectionOrder(Array.from({ length: 100 }, (_, i) => `s${i}`)).length, 30);
});
