import assert from 'node:assert/strict';
import test from 'node:test';
import {
  COMMERCIAL_FILE_RULES,
  commercialAlert,
  commercialFileKey,
  commercialFileType,
  commercialNotes,
  commercialSourceDetail,
  isAllowedCommercialFile,
  isCommercialFileKey,
  isIsoDate,
  normalizeDrawingsLink,
  parseCommercialInquiry,
} from './commercial-inquiry';

const uuid = '123e4567-e89b-12d3-a456-426614174000';
const base = {
  company: 'Acme Construction',
  name: 'Sam Lee',
  phone: '416-555-0100',
  email: 'SAM@acme.example',
  city: 'Toronto',
  projectType: 'Retail',
  consent: true,
};
const tender = { ...base, path: 'tender', keyDate: '2026-12-01' };
const project = { ...base, path: 'project', role: 'Business owner' };

function parsed(body: Record<string, unknown>) {
  const result = parseCommercialInquiry(body);
  if (result.ok === false) throw new Error(result.error);
  return result.value;
}

function error(body: Record<string, unknown>) {
  const result = parseCommercialInquiry(body);
  if (result.ok === true) throw new Error('expected a validation error');
  return result.error;
}

test('a tender is always from a general contractor and needs a real bid date', () => {
  const q = parsed({ ...tender, role: 'Business owner' });
  assert.equal(q.role, 'General contractor');
  assert.equal(q.email, 'sam@acme.example');
  assert.match(error({ ...tender, keyDate: '' }), /bid closing date/);
  assert.match(error({ ...tender, keyDate: '2026-02-31' }), /bid closing date/);
});

test('a quote request needs a role, and its target date is optional', () => {
  assert.equal(parsed(project).keyDate, '');
  assert.equal(parsed({ ...project, keyDate: '2027-03-01' }).keyDate, '2027-03-01');
  assert.match(error({ ...project, keyDate: 'next spring' }), /target date/);
  assert.match(error({ ...project, role: 'General contractor' }), /role/);
  const q = parsed(project);
  assert.match(commercialNotes(q, '2026-11-05T00:00:00.000Z'), /Target completion \/ opening: Not set/);
});

test('required contact details and consent are enforced', () => {
  assert.match(error({ ...tender, company: ' ' }), /company/);
  assert.match(error({ ...tender, phone: '123' }), /phone/);
  assert.match(error({ ...tender, email: 'nope' }), /email/);
  assert.match(error({ ...tender, city: '' }), /city/);
  assert.match(error({ ...tender, projectType: 'Spaceship' }), /project type/);
  assert.match(error({ ...tender, consent: false }), /tick the box/);
});

test('drawings are optional, and a link must be http(s)', () => {
  assert.deepEqual(parsed(tender).files, []);
  assert.equal(normalizeDrawingsLink('https://example.com/set'), 'https://example.com/set');
  assert.equal(normalizeDrawingsLink('javascript:alert(1)'), '');
  assert.match(error({ ...tender, drawingsLink: 'javascript:alert(1)' }), /full link/);
});

test('only keys from the presign flow can be attached', () => {
  const key = commercialFileKey(uuid, 'A-401 elevations (rev 2).pdf');
  assert.equal(isCommercialFileKey(key), true);
  assert.equal(isCommercialFileKey(`window-quotes/${uuid}/a.pdf`), false);
  assert.equal(isCommercialFileKey(`commercial-drawings/${uuid}/../secret.pdf`), false);
  const file = { key: 'finance/doc.pdf', name: 'doc.pdf', size: 100, type: 'application/pdf' };
  assert.match(error({ ...tender, files: [file] }), /could not be accepted/);
  assert.equal(parsed({ ...tender, files: [{ ...file, key }] }).files.length, 1);
});

test('file rules take drawing sets, including the Windows ZIP type', () => {
  assert.equal(isAllowedCommercialFile('application/x-zip-compressed', 1000), true);
  assert.equal(isAllowedCommercialFile('application/pdf', COMMERCIAL_FILE_RULES.maxBytes), true);
  assert.equal(isAllowedCommercialFile('application/pdf', COMMERCIAL_FILE_RULES.maxBytes + 1), false);
  assert.equal(isAllowedCommercialFile('application/x-msdownload', 1000), false);
});

test('CAD files are accepted by extension, whatever the browser reports', () => {
  for (const name of ['plan.dwg', 'PLAN.DXF', 'model.pln']) {
    assert.equal(isAllowedCommercialFile(commercialFileType(name, ''), 1000), true, name);
    assert.equal(isAllowedCommercialFile(commercialFileType(name, 'application/octet-stream'), 1000), true, name);
  }
  assert.equal(isAllowedCommercialFile(commercialFileType('tool.exe', 'application/x-msdownload'), 1000), false);
  assert.equal(isAllowedCommercialFile(commercialFileType('noextension', ''), 1000), false);
});

test('isIsoDate accepts real dates only', () => {
  assert.equal(isIsoDate('2028-02-29'), true);
  assert.equal(isIsoDate('2027-02-29'), false);
  assert.equal(isIsoDate('12/01/2026'), false);
});

test('the lead and alert carry the company, the deadline and login-gated links', () => {
  const key = commercialFileKey(uuid, 'set.pdf');
  const q = parsed({
    ...tender,
    scope: 'Millwork package',
    files: [{ key, name: 'set.pdf', size: 100, type: 'application/pdf' }],
  });
  assert.match(commercialSourceDetail(q), /Commercial \(\/commercial\) · Tender · Acme Construction/);
  const notes = commercialNotes(q, '2026-11-05T00:00:00.000Z');
  assert.match(notes, /Bid closing: 2026-12-01/);
  assert.match(notes, /Consent \(2026-11-05/);
  const alert = commercialAlert(q, 'lead-1', (i) => `https://link/${i}`);
  assert.match(alert.subject, /Acme Construction, bid closes 2026-12-01/);
  assert.match(alert.body, /https:\/\/link\/0/);
  assert.match(alert.body, /one business day/);
});
