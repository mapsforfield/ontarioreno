// The contractor's payments feed, on the client.
//
// One fetch shared by the dashboard, the Payments page and the due-date
// reminder in the layout, so they can't disagree about what is owed. The
// server decides scope and shape (lib/contractor-payments.ts); this only reads
// it and runs each row through the same 45-day clock the admin's dashboard uses.
//
// A FAILED load is reported as a failure, never as an empty list. An empty
// list renders as "Nothing outstanding — all settled", and telling the person
// who pays these that nothing is owed, because a request failed mid-deploy, is
// the one wrong answer this page cannot give. (It did, on the day it shipped.)

import { useEffect, useState } from 'react';
import type { ContractorPayment } from '../../../lib/contractor-payments';
import { balanceClock, type BalanceClock } from './balanceClock';
import { viewAsHeaders } from '../lib/viewAs';
import { torontoToday } from '../lib/time';

export type ContractorPaymentRow = ContractorPayment & { clock: BalanceClock };

export type ContractorPaymentsState =
  | { status: 'loading'; rows: null }
  | { status: 'error'; rows: null }
  | { status: 'ready'; rows: ContractorPaymentRow[] };

let inflight: Promise<ContractorPayment[]> | null = null;

function fetchPayments(): Promise<ContractorPayment[]> {
  inflight ??= fetch('/api/appointments?_resource=payments', {
    credentials: 'include',
    headers: viewAsHeaders(),
  })
    .then(async (res) => {
      if (!res.ok) throw new Error(`payments ${res.status}`);
      const body = await res.json();
      if (!Array.isArray(body)) throw new Error('payments: unexpected response');
      return body as ContractorPayment[];
    })
    .then(
      (rows) => {
        // Share a good answer briefly between the widgets on one page load.
        setTimeout(() => { inflight = null; }, 30_000);
        return rows;
      },
      (err) => {
        // Never cache a failure: the next mount tries again.
        inflight = null;
        throw err;
      }
    );
  return inflight;
}

function toRows(payments: ContractorPayment[]): ContractorPaymentRow[] {
  const today = torontoToday();
  return payments
    .map((p) => ({ ...p, clock: balanceClock(p, today) }))
    .filter((p) => p.clock.active)
    .sort((a, b) => {
      const aSettled = a.clock.status === 'settled';
      const bSettled = b.clock.status === 'settled';
      if (aSettled !== bSettled) return aSettled ? 1 : -1;
      return a.clock.dueOn.localeCompare(b.clock.dueOn);
    });
}

/** Soonest-due first; settled ones last. Retries a failed load once. */
export function useContractorPayments(enabled: boolean): ContractorPaymentsState {
  const [state, setState] = useState<ContractorPaymentsState>({ status: 'loading', rows: null });
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const load = (attempt: number) =>
      fetchPayments().then(
        (payments) => alive && setState({ status: 'ready', rows: toRows(payments) }),
        () => {
          if (!alive) return;
          if (attempt === 0) setTimeout(() => alive && load(1), 3000);
          else setState({ status: 'error', rows: null });
        }
      );
    load(0);
    return () => {
      alive = false;
    };
  }, [enabled]);
  return state;
}

export const money = (n: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 2 }).format(n);
