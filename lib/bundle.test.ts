import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { serveBundle, DEALS_BUNDLE, AUTH_BUNDLE, type BundlePartResult } from './bundle.js';

// A bundle must answer each part exactly as the standalone request would —
// same handler, same query, same headers — or the portal silently loads
// something different from what it loaded before the bundle existed.

function fakeRes() {
  const out: { status: number; body: unknown; headers: Record<string, unknown> } = { status: 200, body: null, headers: {} };
  const res = {
    status(c: number) { out.status = c; return res; },
    json(b: unknown) { out.body = b; return res; },
    setHeader(n: string, v: unknown) { out.headers[n] = v; return res; },
  };
  return { res: res as unknown as VercelResponse, out };
}

function fakeReq(query: Record<string, string>, method = 'GET'): VercelRequest {
  return { method, query, headers: { cookie: 'session=abc', 'x-view-as': 'rep_1' } } as unknown as VercelRequest;
}

test('each part runs the handler with its own query, minus the bundle flag', async () => {
  const seen: Array<Record<string, unknown>> = [];
  const handler = async (req: VercelRequest, res: VercelResponse) => {
    seen.push({ ...req.query });
    return res.status(200).json({ resource: req.query['_resource'] ?? 'list' });
  };
  const { res, out } = fakeRes();
  await serveBundle(fakeReq({ _bundle: '1' }), res, handler, DEALS_BUNDLE, ['_bundle']);

  const parts = (out.body as { parts: Record<string, BundlePartResult> }).parts;
  assert.deepEqual(Object.keys(parts).sort(), Object.keys(DEALS_BUNDLE).sort());
  assert.deepEqual(parts.deals, { status: 200, body: { resource: 'list' } });
  assert.deepEqual(parts.tracker, { status: 200, body: { resource: 'tracker' } });
  assert.ok(seen.every((q) => !('_bundle' in q)), 'the flag must never reach a part');
});

test('parts see the original headers (auth cookie, view-as)', async () => {
  const headersSeen: unknown[] = [];
  const handler = async (req: VercelRequest, res: VercelResponse) => {
    headersSeen.push(req.headers['x-view-as']);
    return res.json([]);
  };
  const { res } = fakeRes();
  await serveBundle(fakeReq({ action: 'bundle' }), res, handler, AUTH_BUNDLE, ['action']);
  assert.equal(headersSeen.length, Object.keys(AUTH_BUNDLE).length);
  assert.ok(headersSeen.every((h) => h === 'rep_1'));
});

test('a failing or throwing part is reported on its own; the others still load', async () => {
  const handler = async (req: VercelRequest, res: VercelResponse) => {
    if (req.query['action'] === 'tasks') throw new Error('boom');
    if (req.query['action'] === 'rep-access') return res.status(403).json({ error: 'nope' });
    return res.status(200).json(['ok']);
  };
  const { res, out } = fakeRes();
  await serveBundle(fakeReq({ action: 'bundle' }), res, handler, AUTH_BUNDLE, ['action']);
  const parts = (out.body as { parts: Record<string, BundlePartResult> }).parts;
  assert.equal(parts.tasks.status, 500);
  assert.equal(parts.rep_access.status, 403);
  assert.deepEqual(parts.activities, { status: 200, body: ['ok'] });
});

test('only GETs are bundled', async () => {
  let ran = false;
  const handler = async () => { ran = true; };
  const { res, out } = fakeRes();
  await serveBundle(fakeReq({ _bundle: '1' }, 'POST'), res, handler, DEALS_BUNDLE, ['_bundle']);
  assert.equal(out.status, 405);
  assert.equal(ran, false);
});
