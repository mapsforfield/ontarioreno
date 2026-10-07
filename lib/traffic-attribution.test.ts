import { test } from 'node:test';
import assert from 'node:assert/strict';
import { attributionFields, trafficChannel } from './traffic-attribution.js';

test('a Google search visit is organic', () => {
  assert.equal(trafficChannel({ referrerHost: 'www.google.com', landingPage: '/basement-renovation-ajax' }), 'google_organic');
  assert.equal(trafficChannel({ referrerHost: 'www.google.ca', landingPage: '/grants' }), 'google_organic');
});

test('a Google ad click is never counted as organic, even with a google referrer', () => {
  assert.equal(trafficChannel({ referrerHost: 'www.google.com', landingPage: '/?gclid=abc' }), 'google_ads');
  assert.equal(trafficChannel({ referrerHost: 'www.google.com', landingPage: '/x?utm_source=google&utm_medium=cpc' }), 'google_ads');
});

test('Meta traffic by click id, utm, referrer, or the site\'s own fb- tags', () => {
  assert.equal(trafficChannel({ landingPage: '/consultation/basement?fbclid=1' }), 'meta');
  assert.equal(trafficChannel({ landingPage: '/x?utm_source=instagram' }), 'meta');
  assert.equal(trafficChannel({ referrerHost: 'l.facebook.com', landingPage: '/x' }), 'meta');
  assert.equal(trafficChannel({ landingPage: '/consultation/basement', sourceDetail: 'fb-basement-financing' }), 'meta');
  assert.equal(trafficChannel({ landingPage: '/consultation/basement', sourceDetail: 'ig/paid' }), 'meta');
});

test('SMS and email links', () => {
  assert.equal(trafficChannel({ landingPage: '/consultation?src=sms' }), 'sms');
  assert.equal(trafficChannel({ landingPage: '/consultation', sourceDetail: 'email' }), 'email');
});

test('other search engines, referrals, and direct', () => {
  assert.equal(trafficChannel({ referrerHost: 'www.bing.com', landingPage: '/' }), 'other_search');
  assert.equal(trafficChannel({ referrerHost: 'www.reddit.com', landingPage: '/grants' }), 'referral');
  assert.equal(trafficChannel({ referrerHost: '', landingPage: '/' }), 'direct');
  // Moving between our own pages is not a referral.
  assert.equal(trafficChannel({ referrerHost: 'ontarioreno.ca', landingPage: '/' }), 'direct');
});

test('words that merely contain a tag are not that tag', () => {
  assert.equal(trafficChannel({ referrerHost: 'www.google.com', landingPage: '/x', sourceDetail: 'Project Review (/match)' }), 'google_organic');
});

test('no capture at all stores as unknown, never as direct', () => {
  assert.deepEqual(attributionFields(undefined), { referrerHost: '', landingPage: '', trafficChannel: '' });
  assert.deepEqual(attributionFields('garbage'), { referrerHost: '', landingPage: '', trafficChannel: '' });
});

test('stored fields are trimmed, lowercased and capped', () => {
  const f = attributionFields({ referrerHost: ' WWW.Google.com ', landingPage: '/a?' + 'x'.repeat(500) });
  assert.equal(f.referrerHost, 'www.google.com');
  assert.equal(f.landingPage.length, 300);
  assert.equal(f.trafficChannel, 'google_organic');
});
