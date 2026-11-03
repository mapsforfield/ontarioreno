import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { changeOrdersOf, countableJobs, invoiceCheck, isContractorInvoice, linkProblem, sameHomeowner } from './change-orders.ts';

const won = (id: string, value: number, extra: Record<string, unknown> = {}): { id: string; status: string; estimatedJobValue: number; parentDealId?: string; createdAt?: string } => ({
  id,
  status: 'won',
  estimatedJobValue: value,
  ...extra,
});

describe('counting jobs', () => {
  it('a change order is not a second won deal', () => {
    const deals = [won('melo', 78535), won('closet', 678, { parentDealId: 'melo' }), won('nithin', 58000)];
    assert.equal(countableJobs(deals).length, 2);
  });

  it('lists a job’s change orders oldest first', () => {
    const deals = [
      won('b', 2, { parentDealId: 'p', createdAt: '2026-09-02' }),
      won('a', 1, { parentDealId: 'p', createdAt: '2026-08-28' }),
      won('x', 3, { parentDealId: 'other' }),
    ];
    assert.deepEqual(changeOrdersOf(deals, 'p').map((d) => d.id), ['a', 'b']);
  });
});

describe('linking', () => {
  const parent = { id: 'p', status: 'won' };
  const child = { id: 'c', status: 'won' };
  it('allows a plain deal under an original job', () => {
    assert.equal(linkProblem(child, parent, false), null);
  });
  it('refuses self, chains, and parents-of-their-own', () => {
    assert.ok(linkProblem(parent, parent, false));
    assert.ok(linkProblem(child, { ...parent, parentDealId: 'z' }, false));
    assert.ok(linkProblem(child, parent, true));
    assert.ok(linkProblem(undefined, parent, false));
  });
});

describe('invoiceCheck', () => {
  const ledger = [
    { dealId: 'melo', salesPrice: 78535, createdAt: '2026-08-01', invoiceNumber: 4055 },
    // Defazio's extra was re-issued at a corrected price; the latest one counts.
    { dealId: 'defazio-extra', salesPrice: 30510, createdAt: '2026-07-11', invoiceNumber: 4050 },
    { dealId: 'defazio-extra', salesPrice: 25510, createdAt: '2026-07-12', invoiceNumber: 4051 },
    { dealId: 'robin', salesPrice: 72320, createdAt: '2026-07-26', invoiceNumber: 4054 },
  ];

  it('catches the closet change order nobody invoiced', () => {
    assert.deepEqual(invoiceCheck(won('closet', 678), ledger), { state: 'never_invoiced' });
  });

  it('is happy when the latest invoice matches', () => {
    assert.deepEqual(invoiceCheck(won('melo', 78535), ledger), { state: 'ok' });
    assert.deepEqual(invoiceCheck(won('defazio-extra', 25510), ledger), { state: 'ok' });
  });

  it('flags a deal whose value moved after it was invoiced', () => {
    assert.deepEqual(invoiceCheck(won('robin', 53110), ledger), {
      state: 'mismatch',
      invoicedPrice: 72320,
      invoiceNumber: 4054,
    });
  });

  it('trusts an invoice number from before the ledger', () => {
    assert.deepEqual(invoiceCheck(won('old', 50000, { invoiceNumber: 4044 }), ledger), { state: 'ok' });
  });

  it('ignores open, lost and historical deals', () => {
    assert.equal(invoiceCheck({ ...won('a', 1), status: 'quoted' }, ledger).state, 'not_applicable');
    assert.equal(invoiceCheck(won('h', 1, { isHistorical: true }), ledger).state, 'not_applicable');
  });
});

describe('sameHomeowner', () => {
  it('matches on phone regardless of formatting', () => {
    assert.equal(
      sameHomeowner({ homeownerName: 'Matthew Melo', phone: '(905) 555-0101' }, { homeownerName: 'M Melo', phone: '+1 905 555 0101' }),
      true
    );
  });
  it('matches on email or exact name', () => {
    assert.equal(sameHomeowner({ homeownerName: 'A', email: 'X@y.ca' }, { homeownerName: 'B', email: 'x@y.ca ' }), true);
    assert.equal(sameHomeowner({ homeownerName: 'Robin  Daniel' }, { homeownerName: 'robin daniel' }), true);
  });
  it('does not match different people', () => {
    assert.equal(sameHomeowner({ homeownerName: 'Robin Daniel', phone: '9055550101' }, { homeownerName: 'Mike Defazio', phone: '9055550199' }), false);
  });
});

describe('isContractorInvoice', () => {
  it('excludes client invoices', () => {
    assert.equal(isContractorInvoice({ snapshot: '{"kind":"client"}' }), false);
    assert.equal(isContractorInvoice({ snapshot: '{"customerName":"x"}' }), true);
    assert.equal(isContractorInvoice({ snapshot: null }), true);
  });
});
