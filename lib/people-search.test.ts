import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchesPersonSearch } from './people-search.js';

const deep = { name: 'Deepkumar Patel', phone: '2368636369', other: ['pateldeep63@gmail.com', 'Barrie'] };
const sam = { name: 'Sam Kumar', phone: '+14166253558', other: ['samysuren@gmail.com', 'Toronto'] };

test('the rep report: "deep Kumar" finds Deepkumar Patel', () => {
  assert.equal(matchesPersonSearch(deep, 'deep Kumar'), true);
  assert.equal(matchesPersonSearch(deep, 'deepkumar'), true);
  assert.equal(matchesPersonSearch(deep, 'patel deep'), true);
  assert.equal(matchesPersonSearch(deep, '  Deepkumar   Patel '), true);
});

test('spaces removed works the other way too', () => {
  assert.equal(matchesPersonSearch(sam, 'samkumar'), true);
});

test('phone in any format', () => {
  for (const q of ['2368636369', '236 863 6369', '(236) 863-6369', '+1 236-863-6369', '12368636369', '863-6369']) {
    assert.equal(matchesPersonSearch(deep, q), true, q);
  }
  for (const q of ['4166253558', '416-625-3558', '(416) 625 3558']) {
    assert.equal(matchesPersonSearch(sam, q), true, q);
  }
});

test('no false matches', () => {
  assert.equal(matchesPersonSearch(sam, 'deep kumar'), false);
  assert.equal(matchesPersonSearch(deep, '4166253558'), false);
  assert.equal(matchesPersonSearch(deep, 'kumar toronto'), false);
});

test('other fields still match', () => {
  assert.equal(matchesPersonSearch(deep, 'barrie'), true);
  assert.equal(matchesPersonSearch(deep, 'pateldeep63'), true);
  assert.equal(matchesPersonSearch(deep, ''), true);
});
