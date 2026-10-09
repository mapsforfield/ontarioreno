import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { payDayDealLabel, payDayMessage } from './payday.ts';

describe('payDayMessage', () => {
  it("tells the admin it's Pay Day, with the amount owed", () => {
    const msg = payDayMessage({
      homeownerName: 'Matthew Melo',
      projectType: 'Basement',
      days: 45,
      audience: 'admin',
      outstanding: 2748,
    });
    assert.equal(msg.title, "💰 It's Pay Day!");
    assert.match(msg.body, /^45 days reached on Matthew Melo · Basement — \$2,748 due today$/);
  });

  it('never shows a rep a dollar amount, even if one is passed', () => {
    const msg = payDayMessage({
      homeownerName: 'Matthew Melo',
      days: 45,
      audience: 'rep',
      outstanding: 2748,
    });
    assert.doesNotMatch(`${msg.title} ${msg.body}`, /\$|2,?748/);
  });

  it('does not promise a rep that it is their pay day', () => {
    const msg = payDayMessage({ homeownerName: 'Matthew Melo', days: 45, audience: 'rep' });
    assert.doesNotMatch(`${msg.title} ${msg.body}`, /pay day/i);
    assert.equal(msg.title, '💰 45 days reached');
    assert.equal(msg.body, 'Matthew Melo — final payment due today');
  });

  it('uses the clock term rather than a hardcoded 45', () => {
    assert.match(payDayMessage({ homeownerName: 'A', days: 60, audience: 'admin' }).body, /^60 days/);
  });

  it('drops the amount when nothing is outstanding', () => {
    const msg = payDayMessage({ homeownerName: 'A', days: 45, audience: 'admin', outstanding: 0 });
    assert.equal(msg.body, '45 days reached on A');
  });

  it('labels a nameless deal sensibly', () => {
    assert.equal(payDayDealLabel('  ', ''), 'a deal');
  });
});
