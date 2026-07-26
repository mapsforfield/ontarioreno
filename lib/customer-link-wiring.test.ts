import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// ─── Query-parameter wiring for the link-check endpoint ───────────────────────
// api/auth/[action].ts is a Vercel DYNAMIC ROUTE, so req.query.action is already
// the path segment ('customer-link-check'). An earlier revision also used
// `action` for the link's own action, which collided: req.query.action never
// returned 'reschedule'/'cancel', so every VALID token was rejected and no
// customer link would have worked in production.
//
// Unit tests could not catch this — the collision lives in the wiring between
// the client and the dynamic-route handler, not in the token logic. These
// assertions pin the contract from both ends.
//
// The constant cannot simply be shared: lib/customer-link.ts imports node:crypto
// and must never be pulled into the browser bundle.

const here = dirname(fileURLToPath(import.meta.url));
const apiSource = readFileSync(join(here, '..', 'api', 'auth', '[action].ts'), 'utf8');
const clientSource = readFileSync(
  join(here, '..', 'src', 'portal', 'lib', 'customerLinks.ts'),
  'utf8'
);

const PARAM = 'linkAction';

test('the server reads the link action from a non-colliding parameter', () => {
  assert.ok(
    apiSource.includes(`req.query['${PARAM}']`),
    `the handler must read the link action from req.query['${PARAM}']`
  );
});

test('the server never reads the link action from the dynamic-route parameter', () => {
  // `const action = req.query['action']` at the top is the ROUTE name and is
  // expected. What must not exist is a second read assigning it to linkAction.
  assert.ok(
    !/linkAction\s*=\s*String\(\s*req\.query\['action'\]/.test(apiSource),
    "the link action must not be read from req.query['action'] — that is the route segment"
  );
});

test('the client sends the same parameter name the server reads', () => {
  assert.ok(
    clientSource.includes(`${PARAM}:`),
    `the client must send '${PARAM}' in the link-check query`
  );
  assert.ok(
    !/URLSearchParams\(\{[^}]*\baction:\s/.test(clientSource),
    "the client must not send a bare 'action' parameter — it collides with the dynamic route"
  );
});

test('both ends agree on exactly one parameter name', () => {
  const serverUses = apiSource.includes(`req.query['${PARAM}']`);
  const clientUses = clientSource.includes(`${PARAM}:`);
  assert.equal(
    serverUses && clientUses,
    true,
    'client and server must use the same link-action parameter name'
  );
});
