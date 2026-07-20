import assert from 'node:assert/strict';
import test from 'node:test';
import { officialSourceFromProgram, validOfficialSourceUrl } from './grant-source.js';
import { renderHubHtml, renderPageHtml } from './grants.js';

const program = {
  id: 'program-1', city: 'Kingston', name: 'Kingston ADU Grant', maxAmount: '$20,000',
  status: 'active', category: 'ADU', relevanceScore: 90, linkUrl: '',
  sourceUrl: 'https://www.cityofkingston.ca/programs/adu', updatedAt: new Date('2026-07-01'),
};

test('accepts only HTTP and HTTPS official source URLs', () => {
  assert.equal(validOfficialSourceUrl('https://ontario.ca/grants'), 'https://ontario.ca/grants');
  assert.equal(validOfficialSourceUrl('http://example.ca/program'), 'http://example.ca/program');
  assert.equal(validOfficialSourceUrl('javascript:alert(1)'), null);
  assert.equal(validOfficialSourceUrl('not a URL'), null);
  assert.equal(validOfficialSourceUrl(''), null);
});

test('resolves historical scanner storage before the related scan source', () => {
  assert.equal(officialSourceFromProgram({ sourceUrl: '', sourceUrls: ['https://ontario.ca/historical'], source: { url: 'https://canada.ca/fallback' } }), 'https://ontario.ca/historical');
  assert.equal(officialSourceFromProgram({ sourceUrl: 'invalid', sourceUrls: [], source: { url: 'https://www.toronto.ca/program' } }), 'https://www.toronto.ca/program');
});

test('hub shows a secure source link and keeps View grant routing', () => {
  const html = renderHubHtml([{ programId: 'program-1', slug: 'kingston-adu', city: 'Kingston' }], [program]);
  assert.match(html, /Official program source ↗/);
  assert.match(html, /href="https:\/\/www\.cityofkingston\.ca\/programs\/adu" target="_blank" rel="noopener noreferrer"/);
  assert.match(html, /href="\/grants\/kingston-adu">View grant/);
  assert.doesNotMatch(html, /nofollow/);
});

test('hub hides invalid sources and keeps Check eligibility routing', () => {
  const html = renderHubHtml([], [{ ...program, sourceUrl: 'javascript:alert(1)' }]);
  assert.doesNotMatch(html, /Official program source/);
  assert.match(html, /href="\/match\?ref=grants-hub">Check eligibility/);
});

test('generated page shows source verification only for a valid source', () => {
  const basePage = {
    slug: 'kingston-adu', city: 'Kingston', heroEyebrow: '', heroTitle: 'Kingston ADU Grant',
    heroSubtitle: 'Details', amountLabel: '$20,000', intro: '', ctaHeading: '', ctaText: '',
    seoTitle: '', seoDescription: '', sections: [], eligibility: [], faqs: [],
  };
  const shown = renderPageHtml({ ...basePage, officialSourceUrl: program.sourceUrl, officialSourceLabel: 'City of Kingston' });
  assert.match(shown, /Official source: Verify current program details/);
  assert.match(shown, /target="_blank" rel="noopener noreferrer"/);
  assert.doesNotMatch(shown, /nofollow/);

  const hidden = renderPageHtml({ ...basePage, officialSourceUrl: 'ftp://example.ca/program' });
  assert.doesNotMatch(hidden, /Official source: Verify current program details/);
});

test('hub source link has mobile-friendly spacing in the responsive layout', () => {
  const html = renderHubHtml([], [program]);
  assert.match(html, /\.sourcelink\{[^}]*padding:6px 0/);
  assert.match(html, /@media\(max-width:680px\)/);
});
