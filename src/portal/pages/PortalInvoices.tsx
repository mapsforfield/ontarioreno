// ─── Client Invoices (marketing side) ─────────────────────────────────────────
//
// Admin-only. The commission invoice is reachable only from inside a Deal,
// because it charges a contractor a percentage of that deal — which leaves no
// way to bill a marketing client for a retainer or a one-off project. This page
// is that way in.
//
// It does NOT replace or wrap the commission generator: PortalDeals still opens
// CommissionInvoice exactly as before. Both write to the same ledger and share
// one invoice-number sequence, so numbers can never collide across the two.
// Rows are told apart by the `kind: 'client'` marker on the snapshot; anything
// without it is a commission invoice and stays on the Commissions tab.

import { FilePlus2, Loader2, ReceiptText, Trash2 } from 'lucide-react';
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { usePortalAuth } from '../auth';
import { usePortalData } from '../data/store';
import { showToast } from '../lib/toast';
import type { ClientInvoiceData } from '../components/ClientInvoice';
import type { CommissionInvoiceRecord } from '../data/types';

const ClientInvoice = lazy(() => import('../components/ClientInvoice'));
const ClientInvoiceViewer = lazy(() => import('../components/ClientInvoiceViewer'));

/** A ledger row is a client invoice when its snapshot says so. */
function parseClientSnapshot(row: CommissionInvoiceRecord): ClientInvoiceData | null {
  if (!row.snapshot) return null;
  try {
    const parsed = JSON.parse(row.snapshot) as Partial<ClientInvoiceData>;
    return parsed?.kind === 'client' ? (parsed as ClientInvoiceData) : null;
  } catch {
    return null;
  }
}

function money(v: number) {
  return `$${(v ?? 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function PortalInvoices() {
  const { isAdmin } = usePortalAuth();
  const { listInvoices, deleteInvoice } = usePortalData();

  const [rows, setRows] = useState<CommissionInvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<ClientInvoiceData | null>(null);

  const refresh = useCallback(() => {
    if (!isAdmin) return;
    listInvoices()
      .then((all) => setRows(all.filter((row) => parseClientSnapshot(row) !== null)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAdmin, listInvoices]);

  useEffect(() => { refresh(); }, [refresh]);

  if (!isAdmin) {
    return (
      <div className="rounded-[0.5rem] border border-white bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-bold text-slate-500">Invoicing is admin only.</p>
      </div>
    );
  }

  const openRow = (row: CommissionInvoiceRecord) => {
    const data = parseClientSnapshot(row);
    if (!data) {
      showToast({ variant: 'error', message: 'Could not open this invoice.' });
      return;
    }
    setViewing(data);
  };

  const handleDelete = async (row: CommissionInvoiceRecord) => {
    if (!window.confirm(`Remove invoice #${row.invoiceNumber ?? ''} (${row.customerName}) from the history?`)) return;
    setRows((cur) => cur.filter((r) => r.id !== row.id));
    await deleteInvoice(row.id);
  };

  return (
    <div className="space-y-4 pb-16 lg:pb-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#32639b]">Marketing &amp; retainers</p>
          <h1 className="text-3xl font-black tracking-[-0.03em] text-slate-950">Invoices</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Bill a marketing client directly — retainers, project fees, extras — with HST. Commission
            invoices still live on the deal they belong to.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex items-center justify-center gap-2 rounded-[0.5rem] bg-[#1B3C6C] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#153158]"
        >
          <FilePlus2 className="h-4 w-4" /> New client invoice
        </button>
      </div>

      {/* History */}
      <section className="overflow-hidden rounded-[0.5rem] border border-white bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#32639b]">
            Client Invoice History ({rows.length})
          </p>
          <p className="mt-0.5 text-sm font-semibold text-slate-500">
            Most recent first. Click a row to re-open the exact PDF that went out.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center px-4 py-16 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <ReceiptText className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-bold text-slate-500">No client invoices yet.</p>
            <p className="mt-1 text-sm font-semibold text-slate-400">
              Hit “New client invoice” to bill a retainer or a one-off project.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-black uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-2">Invoice</th>
                  <th className="px-4 py-2">Client</th>
                  <th className="px-4 py-2">Subtotal</th>
                  <th className="px-4 py-2">HST</th>
                  <th className="px-4 py-2">Total</th>
                  <th className="hidden px-4 py-2 sm:table-cell">Sent to</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => openRow(row)}
                    className="cursor-pointer border-b border-slate-50 transition hover:bg-[#f6faff]"
                  >
                    <td className="px-4 py-2 font-black text-slate-900">#{row.invoiceNumber ?? '—'}</td>
                    <td className="px-4 py-2 font-bold text-slate-700">{row.customerName}</td>
                    <td className="px-4 py-2 font-semibold text-slate-600">{money(row.baseAmount)}</td>
                    <td className="px-4 py-2 font-semibold text-slate-600">{money(row.adjustmentsTotal)}</td>
                    <td className="px-4 py-2 font-black text-[#1B3C6C]">{money(row.netAmount)}</td>
                    <td className="hidden px-4 py-2 font-semibold text-slate-500 sm:table-cell">{row.sentTo || '—'}</td>
                    <td className="px-4 py-2 font-semibold text-slate-500">{formatDate(row.createdAt)}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); void handleDelete(row); }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-300 transition hover:bg-red-50 hover:text-red-500"
                        aria-label="Remove from history"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {creating && (
        <Suspense fallback={null}>
          <ClientInvoice onClose={() => setCreating(false)} onSaved={refresh} />
        </Suspense>
      )}
      {viewing && (
        <Suspense fallback={null}>
          <ClientInvoiceViewer data={viewing} onClose={() => setViewing(null)} />
        </Suspense>
      )}
    </div>
  );
}
