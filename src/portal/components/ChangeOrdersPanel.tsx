// Change orders, inside the deal drawer.
//
// On an original won job: its add-ons, the job's running total, and a form to
// add one. On a change order: which job it belongs to. For an admin, each line
// also says whether it has been invoiced to the contractor, and a deal entered
// separately before this existed can be linked to its original job.
//
// The rules live in lib/change-orders.ts; this is only their face.

import { useState } from 'react';
import { CircleAlert, Link2, Plus, Unlink } from 'lucide-react';
import {
  changeOrdersOf,
  invoiceCheck,
  isChangeOrder,
  sameHomeowner,
  type InvoiceLedgerRow,
} from '../../../lib/change-orders';
import { formatCurrency } from '../data/selectors';
import type { Deal, User } from '../data/types';
import { torontoToday } from '../lib/time';
import { showToast } from '../lib/toast';

type Props = {
  deal: Deal;
  /** Every deal the viewer can see — used to find linked and linkable deals. */
  deals: Deal[];
  isAdmin: boolean;
  /** Contractor invoice ledger. Admin only; null until loaded, or for a rep. */
  invoices: InvoiceLedgerRow[] | null;
  /** Admin: record that a sale was billed as a line on another invoice. */
  onMarkBilledElsewhere?: (deal: Deal, invoiceNumber: number | null) => Promise<void>;
  currentUser?: User;
  onOpenDeal: (deal: Deal) => void;
  addChangeOrder: (
    parentDealId: string,
    input: { description: string; amount: number; signedOn: string },
    actor?: User
  ) => Promise<string | null>;
  linkChangeOrder: (dealId: string, parentDealId: string | null) => Promise<string | null>;
};

/** `invoices` is null until the ledger has loaded — or if it failed to. Then
 *  nothing is shown: an empty list would flag every won deal as Not invoiced. */
export function InvoiceBadge({ deal, invoices }: { deal: Deal; invoices: InvoiceLedgerRow[] | null }) {
  if (!invoices) return null;
  const check = invoiceCheck(deal, invoices);
  if (check.state === 'never_invoiced') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-wide text-red-700">
        <CircleAlert className="h-2.5 w-2.5" />
        Not invoiced
      </span>
    );
  }
  if (check.state === 'mismatch') {
    return (
      <span
        title={`Invoice ${check.invoiceNumber ? `#${check.invoiceNumber} ` : ''}was for ${formatCurrency(check.invoicedPrice)}`}
        className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-wide text-amber-700"
      >
        <CircleAlert className="h-2.5 w-2.5" />
        Invoiced {formatCurrency(check.invoicedPrice)}
      </span>
    );
  }
  return null;
}

export default function ChangeOrdersPanel({
  deal,
  deals,
  isAdmin,
  invoices,
  onMarkBilledElsewhere,
  currentUser,
  onOpenDeal,
  addChangeOrder,
  linkChangeOrder,
}: Props) {
  const [adding, setAdding] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [signedOn, setSignedOn] = useState(torontoToday());
  const [saving, setSaving] = useState(false);
  const [linkTarget, setLinkTarget] = useState('');

  const parent = deal.parentDealId ? deals.find((d) => d.id === deal.parentDealId) : undefined;
  const children = changeOrdersOf(deals, deal.id);
  const isOriginal = !isChangeOrder(deal);
  const canAdd = isOriginal && deal.status === 'won';
  // Won jobs for the same homeowner that this deal could hang off. Only
  // offered on a deal that is not already part of a job either way.
  const linkCandidates =
    isAdmin && isOriginal && children.length === 0
      ? deals.filter(
          (d) =>
            d.id !== deal.id &&
            d.status === 'won' &&
            !isChangeOrder(d) &&
            sameHomeowner(d, deal)
        )
      : [];

  // Nothing to say: an open deal with no links and nothing to link to.
  if (!canAdd && !parent && children.length === 0 && linkCandidates.length === 0) return null;

  const jobTotal = deal.estimatedJobValue + children.reduce((sum, c) => sum + c.estimatedJobValue, 0);

  const save = async () => {
    const value = Number(amount);
    if (!description.trim() || !(value > 0)) return;
    setSaving(true);
    const error = await addChangeOrder(deal.id, { description: description.trim(), amount: value, signedOn }, currentUser);
    setSaving(false);
    if (error) {
      showToast({ variant: 'error', message: error });
      return;
    }
    showToast({
      variant: 'success',
      message: 'Change order added',
      description: isAdmin ? 'It shows as Not invoiced until you send PJ its invoice.' : 'The office has been flagged to invoice it.',
    });
    setAdding(false);
    setDescription('');
    setAmount('');
    setSignedOn(torontoToday());
  };

  // For an add-on billed as an adjustment line on another invoice rather than
  // on its own. Writes a row to the same ledger, so the check clears and
  // Invoice History says where it went.
  const unbilled = (d: Deal) => {
    if (!isAdmin || !invoices || !onMarkBilledElsewhere) return false;
    const state = invoiceCheck(d, invoices).state;
    return state === 'never_invoiced' || state === 'mismatch';
  };
  const markBilledElsewhere = async (d: Deal) => {
    const answer = window.prompt(
      `"${d.projectType}" (${formatCurrency(d.estimatedJobValue)}) was billed as a line on another invoice?\n\nInvoice number it was billed on:`
    );
    if (answer === null) return;
    const number = Number(answer.replace(/\D/g, ''));
    await onMarkBilledElsewhere?.(d, Number.isFinite(number) && number > 0 ? number : null);
    showToast({ variant: 'success', message: 'Marked as invoiced' });
  };

  const link = async (parentId: string | null) => {
    const error = await linkChangeOrder(deal.id, parentId);
    if (error) showToast({ variant: 'error', message: error });
    else showToast({ variant: 'success', message: parentId ? 'Linked to the original job' : 'Unlinked' });
    setLinkTarget('');
  };

  return (
    <div className="col-span-full rounded-[0.5rem] border border-slate-100 bg-[#fbfdff] p-3">
      <p className="text-[0.6rem] font-black uppercase tracking-[0.14em] text-[#32639b]">
        {parent ? 'Change order' : 'Change orders'}
      </p>

      {parent && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold text-slate-600">Add-on to</span>
          <button
            type="button"
            onClick={() => onOpenDeal(parent)}
            className="font-black text-[#1B3C6C] underline-offset-2 hover:underline"
          >
            {parent.homeownerName} — {parent.projectType} ({formatCurrency(parent.estimatedJobValue)})
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => link(null)}
              className="inline-flex items-center gap-1 text-[0.6rem] font-black uppercase tracking-wide text-slate-400 transition hover:text-red-600"
              title="Make this a stand-alone deal again. Value, invoices and payments are untouched."
            >
              <Unlink className="h-3 w-3" />
              Unlink
            </button>
          )}
        </div>
      )}
      {deal.parentDealId && !parent && (
        <p className="mt-2 text-sm font-semibold text-slate-500">Add-on to a job that is no longer on the board.</p>
      )}

      {isOriginal && (children.length > 0 || canAdd) && (
        <div className="mt-2 space-y-1.5">
          <div className="flex items-center justify-between gap-2 rounded-[0.4rem] bg-white px-2.5 py-1.5 text-sm">
            <span className="min-w-0 truncate font-semibold text-slate-600">Original sale</span>
            <span className="flex shrink-0 items-center gap-2">
              {isAdmin && <InvoiceBadge deal={deal} invoices={invoices} />}
              <span className="font-black text-slate-900">{formatCurrency(deal.estimatedJobValue)}</span>
            </span>
          </div>
          {children.map((child) => (
            <button
              key={child.id}
              type="button"
              onClick={() => onOpenDeal(child)}
              className="flex w-full items-center justify-between gap-2 rounded-[0.4rem] bg-white px-2.5 py-1.5 text-left text-sm transition hover:bg-[#f6faff]"
            >
              <span className="min-w-0 truncate font-semibold text-slate-700">+ {child.projectType}</span>
              <span className="flex shrink-0 items-center gap-2">
                {isAdmin && <InvoiceBadge deal={child} invoices={invoices} />}
                <span className="font-black text-slate-900">{formatCurrency(child.estimatedJobValue)}</span>
              </span>
            </button>
          ))}
          {[deal, ...children].filter(unbilled).map((d) => (
            <button
              key={`billed-${d.id}`}
              type="button"
              onClick={() => markBilledElsewhere(d)}
              className="block px-2.5 text-left text-[0.6rem] font-black uppercase tracking-wide text-slate-400 transition hover:text-[#1B3C6C]"
            >
              {d.id === deal.id ? 'Original' : `“${d.projectType}”`} already billed on another invoice? Mark it
            </button>
          ))}
          {children.length > 0 && (
            <div className="flex items-center justify-between gap-2 border-t border-slate-200 px-2.5 pt-1.5 text-sm">
              <span className="font-black text-slate-700">Job total</span>
              <span className="font-black text-[#1B3C6C]">{formatCurrency(jobTotal)}</span>
            </div>
          )}
        </div>
      )}

      {canAdd && !adding && (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-2 inline-flex items-center gap-1.5 rounded-[0.5rem] border border-[#b8c9dd] bg-white px-3 py-1.5 text-sm font-bold text-[#1B3C6C] transition hover:bg-[#e8f1fb]"
        >
          <Plus className="h-4 w-4" />
          Add change order
        </button>
      )}

      {canAdd && adding && (
        <div className="mt-2 grid gap-2 rounded-[0.5rem] border border-[#d6e4f5] bg-white p-3 sm:grid-cols-[minmax(0,2fr)_8rem_9rem]">
          <label className="grid gap-1 text-xs font-bold text-slate-600">
            What was added
            <input
              value={description}
              autoFocus
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Colour change for closet"
              maxLength={200}
            />
          </label>
          <label className="grid gap-1 text-xs font-bold text-slate-600">
            Amount ($)
            <input
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="678"
            />
          </label>
          <label className="grid gap-1 text-xs font-bold text-slate-600">
            Signed on
            <input type="date" value={signedOn} onChange={(e) => setSignedOn(e.target.value)} />
          </label>
          <p className="text-[0.68rem] font-semibold leading-4 text-slate-500 sm:col-span-3">
            Saved as its own sale under this job, so it gets its own invoice and commission. A
            credit or removed scope goes on the next invoice as an adjustment instead.
          </p>
          <div className="flex items-center gap-2 sm:col-span-3">
            <button
              type="button"
              disabled={saving || !description.trim() || !(Number(amount) > 0)}
              onClick={save}
              className="rounded-[0.5rem] bg-[#1B3C6C] px-3 py-1.5 text-sm font-bold text-white transition hover:bg-[#153158] disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Save change order'}
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="rounded-[0.5rem] border border-slate-200 px-3 py-1.5 text-sm font-bold text-slate-500 transition hover:text-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {linkCandidates.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <Link2 className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-600">Is this an add-on to another job?</span>
          <select
            value={linkTarget}
            onChange={(e) => setLinkTarget(e.target.value)}
            className="max-w-full rounded-[0.4rem] border border-slate-200 py-1 pl-2 pr-7 text-xs font-bold"
          >
            <option value="">Pick the original job…</option>
            {linkCandidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.projectType} — {formatCurrency(c.estimatedJobValue)}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!linkTarget}
            onClick={() => link(linkTarget)}
            className="rounded-[0.4rem] bg-[#1B3C6C] px-2.5 py-1 text-xs font-black text-white transition hover:bg-[#153158] disabled:opacity-40"
          >
            Link
          </button>
        </div>
      )}
    </div>
  );
}
