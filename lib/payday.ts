// Pay Day — the day a 45-day balance clock comes due.
//
// The clock itself lives in src/portal/data/balanceClock.ts; this file only
// decides what to SAY when it arrives. It is shared by the morning-brief push
// (api/appointments) and the dashboard banner, so the phone and the portal
// can never word the same event two different ways.
//
// The audiences are worded differently on purpose:
//
// - The admin gets "It's Pay Day!" and the amount still owed. Day 45 is the
//   day the contractor owes the house the remainder.
// - A rep gets the deal and the milestone, never a dollar figure. The admin's
//   net is total commission minus the rep's cut, so a rep shown it can add
//   their own share and recover the total rate and the margin (see
//   pendingBalanceClocks). And it is not "Pay Day" for them — day 45 is not
//   necessarily the day the rep is paid, so the headline must not promise it.

export type PayDayAudience = 'admin' | 'rep';

export type PayDayInput = {
  homeownerName: string;
  projectType?: string | null;
  /** The clock's term — 45 for the Galaxy deals. */
  days: number;
  audience: PayDayAudience;
  /** Admin only. Ignored for a rep, whatever is passed. */
  outstanding?: number | null;
};

export type PayDayMessage = { title: string; body: string };

const money = (value: number) =>
  new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(value);

/** "Matthew Melo · Basement" — the deal as a rep would recognise it. */
export function payDayDealLabel(homeownerName: string, projectType?: string | null): string {
  const name = homeownerName.trim() || 'a deal';
  const project = (projectType ?? '').trim();
  return project ? `${name} · ${project}` : name;
}

export function payDayMessage(input: PayDayInput): PayDayMessage {
  const deal = payDayDealLabel(input.homeownerName, input.projectType);
  if (input.audience === 'admin') {
    const amount =
      typeof input.outstanding === 'number' && input.outstanding > 0
        ? ` — ${money(input.outstanding)} due today`
        : '';
    return {
      title: "💰 It's Pay Day!",
      body: `${input.days} days reached on ${deal}${amount}`,
    };
  }
  return {
    title: `💰 ${input.days} days reached`,
    body: `${deal} — final payment due today`,
  };
}
