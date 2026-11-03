// The contractor's payments feed, on the client.
//
// One fetch shared by the Payments page and the due-date reminder in the
// layout, so they can't disagree about what is owed. The server decides scope
// and shape (lib/contractor-payments.ts); this only reads it and runs each row
// through the same 45-day clock the admin's dashboard uses.

import { useEffect, useState } from 'react';
import type { ContractorPayment } from '../../../lib/contractor-payments';
import { balanceClock, type BalanceClock } from './balanceClock';
import { viewAsHeaders } from '../lib/viewAs';
import { torontoToday } from '../lib/time';

export type ContractorPaymentRow = ContractorPayment & { clock: BalanceClock };

let inflight: Promise<ContractorPayment[]> | null = null;

function fetchPayments(): Promise<ContractorPayment[]> {
  inflight ??= fetch('/api/appointments?_resource=payments', {
    credentials: 'include',
    headers: viewAsHeaders(),
  })
    .then((res) => (res.ok ? (res.json() as Promise<ContractorPayment[]>) : []))
    .catch(() => [])
    .finally(() => {
      // Let the next mount re-read rather than serve this result forever.
      setTimeout(() => { inflight = null; }, 30_000);
    });
  return inflight;
}

/** Soonest-due first; settled ones last. `null` while loading. */
export function useContractorPayments(enabled: boolean): ContractorPaymentRow[] | null {
  const [rows, setRows] = useState<ContractorPaymentRow[] | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const today = torontoToday();
    fetchPayments().then((payments) => {
      if (!alive) return;
      setRows(
        payments
          .map((p) => ({ ...p, clock: balanceClock(p, today) }))
          .filter((p) => p.clock.active)
          .sort((a, b) => {
            const aSettled = a.clock.status === 'settled';
            const bSettled = b.clock.status === 'settled';
            if (aSettled !== bSettled) return aSettled ? 1 : -1;
            return a.clock.dueOn.localeCompare(b.clock.dueOn);
          })
      );
    });
    return () => {
      alive = false;
    };
  }, [enabled]);
  return rows;
}

export const money = (n: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 2 }).format(n);
