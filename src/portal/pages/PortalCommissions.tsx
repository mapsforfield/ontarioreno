import {
  AlarmClock,
  ArrowUpDown,
  BadgeDollarSign,
  Banknote,
  ChevronDown,
  CircleDollarSign,
  ExternalLink,
  HandCoins,
  Search,
  Settings2,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePortalAuth } from '../auth';
import BalanceClockControl from '../components/BalanceClockControl';
import { InvoiceBadge } from '../components/ChangeOrdersPanel';
import { invoiceCheck, isChangeOrder, isContractorInvoice } from '../../../lib/change-orders';
import {
  balanceClock,
  DEFAULT_BALANCE_CLOCK_DAYS,
  paidFraction,
  pendingBalanceClocks,
  upfrontPaymentUpdates,
  UPFRONT_PRESETS,
  type BalanceClockStatus,
} from '../data/balanceClock';
import { dealWonDate } from '../../../lib/deal-won-date';

/** The year a deal belongs to: when it was won, else its last edit. */
function dealYear(deal: Deal): number {
  return (dealWonDate(deal) ?? new Date(deal.updatedAt)).getFullYear();
}
import {
  formatCurrency,
  formatDealStatus,
} from '../data/selectors';
import { commissionableValue, usePortalData } from '../data/store';
import { showToast } from '../lib/toast';
import { torontoToday } from '../lib/time';
import type { InvoiceData } from '../components/CommissionInvoice';
const InvoiceViewer = lazy(() => import('../components/InvoiceViewer'));
import { Commission, CommissionInvoiceRecord, CommissionPayoutStatus, Deal, DealStatus } from '../data/types';

const projectedStatuses = [
  'new_lead',
  'appointment_booked',
  'quoted',
  'negotiating',
  'won',
];

const openDealStatuses = ['new_lead', 'appointment_booked', 'quoted', 'negotiating'];

const statusFilterOptions: Array<{ label: string; value: DealStatus | 'all' }> = [
  { label: 'All statuses', value: 'all' },
  { label: 'Won', value: 'won' },
  { label: 'Negotiating', value: 'negotiating' },
  { label: 'Quoted', value: 'quoted' },
  { label: 'Appointment Booked', value: 'appointment_booked' },
  { label: 'New Lead', value: 'new_lead' },
  { label: 'Lost', value: 'lost' },
];

function calculateRepEstimatedCommission(deal: Deal) {
  if (deal.status === 'lost') return 0;
  return Math.round(commissionableValue(deal) * 0.05);
}

/** Pending / Partial / Paid derived from an amount paid vs. an amount owed. */
function derivePayoutStatus(paid: number, owed: number): CommissionPayoutStatus {
  if (paid <= 0) return 'pending';
  if (paid >= owed) return 'paid';
  return 'partial';
}

type PaymentFilter = 'all' | 'unpaid' | 'partial' | 'paid';

const paymentFilterOptions: Array<{ label: string; value: PaymentFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Unpaid', value: 'unpaid' },
  { label: 'Partial', value: 'partial' },
  { label: 'Paid', value: 'paid' },
];

/** Overall settlement across BOTH ledgers (rep payout + your net collection):
 *  'paid' = fully settled, 'unpaid' = nothing paid on either side, else 'partial'. */
function overallPaymentStatus(commission: Commission, deal: Deal): Exclude<PaymentFilter, 'all'> {
  const repEst = commission.customPayout
    ? commission.repEstimatedCommission
    : calculateRepEstimatedCommission(deal);
  const repPaid = commission.repPaidCommission;
  const adminNet = (commission.adminTotalEstimatedCommission ?? 0) - repEst;
  const adminPaid = commission.adminNetPaidCommission ?? 0;
  const remaining = Math.max(repEst - repPaid, 0) + Math.max(adminNet - adminPaid, 0);
  const paidSoFar =
    Math.max(Math.min(repPaid, repEst), 0) + Math.max(Math.min(adminPaid, Math.max(adminNet, 0)), 0);
  if (remaining <= 0.005) return 'paid';
  if (paidSoFar <= 0.005) return 'unpaid';
  return 'partial';
}

/** Rep-only settlement (their payout ledger, not your net) for the rep view. */
function repPaymentStatus(commission: Commission, deal: Deal): Exclude<PaymentFilter, 'all'> {
  const repEst = commission.customPayout
    ? commission.repEstimatedCommission
    : calculateRepEstimatedCommission(deal);
  const s = derivePayoutStatus(commission.repPaidCommission, repEst);
  return s === 'pending' ? 'unpaid' : s;
}

type SortMode = 'newest' | 'oldest' | 'az' | 'amount';

const sortModes: Array<{ value: SortMode; label: string }> = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'az', label: 'A–Z' },
  { value: 'amount', label: 'Value ↓' },
];

function nextSortMode(mode: SortMode): SortMode {
  const i = sortModes.findIndex((m) => m.value === mode);
  return sortModes[(i + 1) % sortModes.length].value;
}

function sortCommissionRows<T extends { deal?: Deal }>(rows: T[], mode: SortMode): T[] {
  const arr = [...rows];
  switch (mode) {
    case 'oldest':
      return arr.sort((a, b) => (a.deal?.createdAt ?? '').localeCompare(b.deal?.createdAt ?? ''));
    case 'az':
      return arr.sort((a, b) => (a.deal?.homeownerName ?? '').localeCompare(b.deal?.homeownerName ?? ''));
    case 'amount':
      return arr.sort((a, b) => (b.deal?.estimatedJobValue ?? 0) - (a.deal?.estimatedJobValue ?? 0));
    case 'newest':
    default:
      return arr.sort((a, b) => (b.deal?.createdAt ?? '').localeCompare(a.deal?.createdAt ?? ''));
  }
}

function SortButton({ mode, onClick }: { mode: SortMode; onClick: () => void }) {
  const label = sortModes.find((m) => m.value === mode)?.label ?? 'Newest';
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-[0.5rem] border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
      title="Click to change sort order"
    >
      <ArrowUpDown className="h-4 w-4 text-slate-400" />
      Sort: {label}
    </button>
  );
}

function PayoutBadge({ status }: { status: CommissionPayoutStatus }) {
  const cls =
    status === 'paid'
      ? 'bg-emerald-100 text-emerald-700'
      : status === 'partial'
        ? 'bg-amber-100 text-amber-700'
        : 'bg-slate-100 text-slate-500';
  return (
    <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-wide ${cls}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

/** Editable sales price (admin). Commits on blur / Enter so we don't fire a
 *  save + activity-log entry on every keystroke. Editing it cascades to every
 *  commission calculation via updateDeal's re-sync. */
/**
 * Number input that commits its value ONCE on blur / Enter instead of on every
 * keystroke. This avoids a save (and a realtime reload on every other open tab)
 * per character typed — same end result, far fewer server calls.
 */
function CommitNumberInput({
  value,
  onCommit,
  className,
  step,
  title,
  round,
}: {
  value: number;
  onCommit: (next: number) => void;
  className?: string;
  step?: number;
  title?: string;
  round?: boolean;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => { setDraft(String(value)); }, [value]);
  const commit = () => {
    const raw = Number(draft);
    const next = Math.max(Number.isFinite(raw) ? (round ? Math.round(raw) : raw) : 0, 0);
    if (next !== value) onCommit(next);
    else setDraft(String(value));
  };
  return (
    <input
      type="number"
      min={0}
      step={step}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
      className={className}
      title={title}
    />
  );
}

// ─── Admin layout pieces ─────────────────────────────────────────────────────
// The admin table used to be ten always-editable columns across 125 rows. Now
// each deal is one read-only line (who, status, value, rate, how much of each
// ledger is paid, clock) that opens into the same editors on click, and the
// deals are grouped by what they need from you.

type SectionKey = 'awaiting' | 'pipeline' | 'paid' | 'lost';

const sectionOrder: SectionKey[] = ['awaiting', 'pipeline', 'paid', 'lost'];

const sectionMeta: Record<SectionKey, { title: string; hint: string }> = {
  awaiting: { title: 'Awaiting payment', hint: 'Won — money still owed to the rep or to you' },
  pipeline: { title: 'Pipeline', hint: 'Open deals — projected commission' },
  paid: { title: 'Paid in full', hint: 'Won — settled on both sides' },
  lost: { title: 'Lost', hint: 'No commission owed' },
};

function sectionFor(commission: Commission, deal: Deal): SectionKey {
  if (deal.status === 'lost') return 'lost';
  if (deal.status !== 'won') return 'pipeline';
  return overallPaymentStatus(commission, deal) === 'paid' ? 'paid' : 'awaiting';
}

function matchesSearch(query: string, haystack: Array<string | undefined | null>): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return haystack.some((value) => (value ?? '').toLowerCase().includes(q));
}

/** 0.085 → "8.5%", 0.1 → "10%". The old input rounded 8.5 up to 9. */
function formatRate(rate: number): string {
  return `${Number((rate * 100).toFixed(2))}%`;
}

function statusTone(status: DealStatus): string {
  if (status === 'won') return 'bg-emerald-100 text-emerald-700';
  if (status === 'lost') return 'bg-slate-100 text-slate-500';
  return 'bg-[#e8f1fb] text-[#1B3C6C]';
}

const clockChipTone: Record<BalanceClockStatus, string> = {
  running: 'bg-slate-100 text-slate-600',
  due_soon: 'bg-amber-100 text-amber-700',
  due: 'bg-emerald-500 text-white',
  overdue: 'bg-red-100 text-red-700',
  settled: 'bg-emerald-100 text-emerald-700',
};

function LedgerProgress({ label, paid, owed }: { label: string; paid: number; owed: number }) {
  const pct = owed > 0 ? Math.min(Math.round((paid / owed) * 100), 100) : 0;
  const done = owed > 0 && paid >= owed - 0.005;
  return (
    <div className="min-w-0">
      <p className="text-sm font-black text-slate-900">
        <span className="mr-1 text-[0.6rem] font-black uppercase tracking-wide text-slate-400 md:hidden">{label}</span>
        {formatCurrency(owed)}
      </p>
      <div className="mt-1 h-1.5 w-full max-w-[9rem] overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full ${done ? 'bg-emerald-500' : 'bg-[#32639b]'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-[0.68rem] font-semibold text-slate-500">
        {owed <= 0 ? '—' : done ? 'Paid in full' : paid > 0 ? `${formatCurrency(paid)} paid · ${pct}%` : 'Nothing paid'}
      </p>
    </div>
  );
}

function EditorField({
  label,
  tone,
  children,
}: {
  label: string;
  tone?: 'rep' | 'me';
  children: ReactNode;
}) {
  const bg = tone === 'rep' ? 'bg-[#f6faff]' : tone === 'me' ? 'bg-[#eef6ff]' : '';
  return (
    <div className={`rounded-[0.4rem] ${bg} ${tone ? 'p-2' : 'py-2'}`}>
      <p className="mb-1 text-[0.6rem] font-black uppercase tracking-[0.1em] text-slate-400">{label}</p>
      {children}
    </div>
  );
}

function metricCard(
  label: string,
  value: string,
  detail: string,
  Icon: typeof BadgeDollarSign
  ) {
  return (
    <article className="rounded-[0.5rem] border border-white bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-black tracking-[-0.02em] text-slate-950">
            {value}
          </p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-[0.5rem] bg-[#e8f1fb] text-[#1B3C6C]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-sm font-medium text-slate-500">{detail}</p>
    </article>
  );
}

export default function PortalCommissions() {
  const { currentUser, isAdmin } = usePortalAuth();
  const {
    calculateAdminPaidRepCommission,
    calculateAdminPendingNetCommission,
    calculateAdminPendingRepCommission,
    calculateAdminProjectedCommission,
    calculatePipelineValue,
    calculateRepPaidCommission,
    calculateRepPendingCommission,
    calculateRepProjectedCommission,
    commissions,
    contractors,
    deals,
    defaultCommissionRate,
    getDealsForRep,
    listInvoices,
    deleteInvoice,
    setDefaultCommissionRate,
    updateCommission,
    updateDeal,
    users,
  } = usePortalData();
  const [rateInput, setRateInput] = useState(String(Number((defaultCommissionRate * 100).toFixed(2))));
  const [rateSaved, setRateSaved] = useState(false);
  const [statusFilter, setStatusFilter] = useState<DealStatus | 'all'>('all');
  const [yearFilter, setYearFilter] = useState<number | 'all'>(() => Number(torontoToday().slice(0, 4)));
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
  const [payoutView, setPayoutView] = useState<'reps' | 'me'>('reps');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [invoices, setInvoices] = useState<CommissionInvoiceRecord[]>([]);
  // The invoice check needs to know the ledger actually arrived: on an empty
  // list every won deal would read Not invoiced.
  const [invoicesLoaded, setInvoicesLoaded] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<InvoiceData | null>(null);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<SectionKey[]>(['paid', 'lost']);
  const [showRateSettings, setShowRateSettings] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const today = torontoToday();

  // Open one deal's row: clear anything that could hide it, expand it, and
  // flash it so the eye lands on it. Used by the dashboard's 45-day list and
  // Pay Day banner (via router state) and by the shortcuts on this page.
  const focusCommission = (commissionId: string) => {
    setStatusFilter('all');
    setYearFilter('all');
    setPaymentFilter('all');
    setSearch('');
    setExpandedId(commissionId);
    setHighlightId(commissionId);
  };

  useEffect(() => {
    const focusId = (location.state as { focusCommissionId?: string } | null)?.focusCommissionId;
    // Wait for the commission to load — arriving before the data would focus
    // nothing and then never try again (same trap as PortalDeals' openDealId).
    if (!focusId || !commissions.some((c) => c.id === focusId)) return;
    focusCommission(focusId);
    navigate(location.pathname, { replace: true, state: null });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, commissions]);

  useEffect(() => {
    if (!highlightId) return;
    document
      .getElementById(`commission-${highlightId}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const timer = setTimeout(() => setHighlightId(null), 2500);
    return () => clearTimeout(timer);
  }, [highlightId]);

  const handleDeleteInvoice = async (inv: CommissionInvoiceRecord) => {
    if (!window.confirm(`Remove invoice #${inv.invoiceNumber ?? ''} (${inv.customerName}) from the history?`)) return;
    setInvoices((cur) => cur.filter((i) => i.id !== inv.id));
    await deleteInvoice(inv.id);
  };

  const openInvoice = (inv: CommissionInvoiceRecord) => {
    if (!inv.snapshot) {
      showToast({ variant: 'default', message: 'No saved copy', description: 'This invoice predates re-view — open its deal to regenerate it.' });
      return;
    }
    try {
      setViewingInvoice(JSON.parse(inv.snapshot) as InvoiceData);
    } catch {
      showToast({ variant: 'error', message: 'Could not open this invoice.' });
    }
  };

  useEffect(() => {
    // Client invoices (Portal → Invoices) share this ledger but have a different
    // snapshot shape, and would re-render through the commission builder as a
    // blank commission. They have their own history on their own page.
    if (isAdmin)
      listInvoices()
        .then((rows) => {
          setInvoices(rows.filter(isContractorInvoice));
          setInvoicesLoaded(true);
        })
        .catch(() => {});
  }, [isAdmin, listInvoices]);

  if (!currentUser) return null;

  const reps = users.filter((user) => user.role === 'rep');
  const visibleDeals = isAdmin ? deals : getDealsForRep(currentUser.id);
  const visibleCommissions = isAdmin
    ? commissions
    : commissions.filter((commission) => commission.repId === currentUser.id);

  const getDeal = (dealId: string) =>
    deals.find((deal) => deal.id === dealId);
  const getContractorName = (deal: Deal | undefined) => {
    const contractor = contractors.find(
      (candidate) => candidate.id === deal?.assignedContractorId
    );

    return contractor?.companyName ?? 'Unassigned';
  };
  const getRepName = (repId: string) =>
    reps.find((rep) => rep.id === repId)?.name ?? repId;

  if (isAdmin) {
    const adminRows = visibleCommissions
      .map((commission) => ({
        commission,
        deal: getDeal(commission.dealId),
      }))
      .filter((row) => row.deal);

    // Years present in the data, by the date each deal was WON, plus the
    // current year so it is always selectable even before any deal is won this
    // year. This read updatedAt until it was the same bug as the WON column:
    // editing an old deal moved its commission into the current year.
    const yearSet = new Set<number>(adminRows.map((r) => dealYear(r.deal!)));
    yearSet.add(Number(torontoToday().slice(0, 4)));
    const availableYears = Array.from(yearSet).sort((a, b) => b - a);

    // Filter rows by deal status AND year, and recompute the summary totals so
    // the cards reflect exactly what's shown in the table below.
    const filteredRows = adminRows.filter(
      (row) =>
        (statusFilter === 'all' || row.deal!.status === statusFilter) &&
        (yearFilter === 'all' || dealYear(row.deal!) === yearFilter) &&
        (paymentFilter === 'all' || overallPaymentStatus(row.commission, row.deal!) === paymentFilter) &&
        matchesSearch(search, [
          row.deal!.homeownerName,
          row.deal!.projectType,
          row.deal!.city,
          row.deal!.address,
          row.deal!.phone,
          row.deal!.email,
          getRepName(row.commission.repId),
          getContractorName(row.deal),
        ])
    );

    const totals = filteredRows.reduce(
      (acc, { commission, deal }) => {
        if (!deal) return acc;
        acc.paidOut += commission.repPaidCommission;
        acc.paidToMe += commission.adminNetPaidCommission ?? 0;
        if (!deal.isHistorical && projectedStatuses.includes(deal.status)) {
          acc.projected += commission.adminTotalEstimatedCommission ?? 0;
        }
        if (deal.status === 'won' && !deal.isHistorical) {
          // Two independent ledgers: what's still owed to the rep, and what's
          // still owed to you (net not yet collected from the contractor).
          acc.pendingRep += Math.max(
            commission.repEstimatedCommission - commission.repPaidCommission,
            0
          );
          acc.adminNetPending += Math.max(
            (commission.adminNetCommission ?? 0) - (commission.adminNetPaidCommission ?? 0),
            0
          );
        }
        return acc;
      },
      { projected: 0, pendingRep: 0, adminNetPending: 0, paidOut: 0, paidToMe: 0 }
    );

    const filterLabel =
      statusFilterOptions.find((o) => o.value === statusFilter)?.label ?? 'All statuses';
    const isFiltered = statusFilter !== 'all';
    const searching = search.trim() !== '';

    // Group what's left after filtering into the four questions an admin
    // actually opens this page with: who still owes / is owed, what's coming,
    // what's done, what fell through. The last two start collapsed.
    const grouped = sectionOrder.map((key) => ({
      key,
      rows: sortCommissionRows(
        filteredRows.filter((row) => sectionFor(row.commission, row.deal!) === key),
        sortMode
      ),
    }));

    // Every deal still waiting on its second payment, soonest first — the same
    // list the dashboard shows, as one-tap shortcuts into the table.
    const clockShortcuts = pendingBalanceClocks(commissions, deals, today, { canSeeAmounts: true });

    // Won sales with no invoice to the contractor, or invoiced at a different
    // price than the deal shows now — money that will never arrive unless
    // someone sends PJ an invoice. See lib/change-orders.ts.
    const needsInvoice = (invoicesLoaded ? adminRows : [])
      .map(({ commission, deal }) => ({ commission, deal: deal!, check: invoiceCheck(deal!, invoices) }))
      .filter((row) => row.check.state === 'never_invoiced' || row.check.state === 'mismatch');

    const selectClass =
      'rounded-[0.5rem] border border-slate-200 bg-white py-1.5 pl-2.5 pr-7 text-sm font-bold text-slate-700 focus:border-[#32639b] focus:outline-none focus:ring-2 focus:ring-[#32639b]/20';

    const renderRow = ({ commission, deal }: { commission: Commission; deal?: Deal }) => {
      if (!deal) return null;
      const isCustom = commission.customPayout ?? false;
      // Rep ledger: what the rep is owed vs. what you've paid them.
      // Custom payouts use the manually-entered rep cut, not 5% of job.
      const repEstimatedCommission = isCustom
        ? commission.repEstimatedCommission
        : calculateRepEstimatedCommission(deal);
      const repStatus = derivePayoutStatus(commission.repPaidCommission, repEstimatedCommission);
      // Your ledger: your net vs. what you've collected from the contractor.
      const adminNet = (commission.adminTotalEstimatedCommission ?? 0) - repEstimatedCommission;
      const adminReceived = commission.adminNetPaidCommission ?? 0;
      const adminStatus = derivePayoutStatus(adminReceived, adminNet);
      const ledger = { repEstimatedCommission, adminNetCommission: adminNet };
      const paidPercent = Math.round(
        paidFraction({ repEstimatedCommission, repPaidCommission: commission.repPaidCommission }) * 100
      );
      const clock = balanceClock(commission, today);
      const isOpen = expandedId === commission.id;
      const recordShare = (fraction: number) =>
        updateCommission(commission.id, upfrontPaymentUpdates(ledger, fraction), currentUser);

      return (
        <div
          key={commission.id}
          id={`commission-${commission.id}`}
          className={`scroll-mt-24 transition ${
            highlightId === commission.id ? 'bg-amber-50 ring-2 ring-inset ring-amber-300' : isOpen ? 'bg-[#fbfdff]' : ''
          }`}
        >
          <button
            type="button"
            onClick={() => setExpandedId(isOpen ? null : commission.id)}
            aria-expanded={isOpen}
            className="grid w-full grid-cols-2 items-center gap-x-4 gap-y-3 px-4 py-3 text-left transition hover:bg-[#f6faff] md:grid-cols-[minmax(0,2.2fr)_6.5rem_6.5rem_4rem_minmax(0,1.2fr)_minmax(0,1.2fr)_6.5rem_1rem]"
          >
            <div className="col-span-2 min-w-0 md:col-span-1">
              <p className="flex flex-wrap items-center gap-1.5 font-black text-slate-950">
                <span className="truncate">{deal.homeownerName}</span>
                {isChangeOrder(deal) && (
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-wide text-violet-700">
                    Change order
                  </span>
                )}
                <InvoiceBadge deal={deal} invoices={invoicesLoaded ? invoices : null} />
              </p>
              <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                {deal.projectType} · {getContractorName(deal)} · <span className="text-slate-700">{getRepName(commission.repId)}</span>
              </p>
            </div>
            <div>
              <span className={`inline-block rounded-full px-2.5 py-0.5 text-[0.65rem] font-black ${statusTone(deal.status)}`}>
                {formatDealStatus(deal.status)}
              </span>
            </div>
            <div className="text-sm font-black text-[#1B3C6C]">
              <span className="mr-1 text-[0.6rem] font-black uppercase tracking-wide text-slate-400 md:hidden">Job</span>
              {formatCurrency(deal.estimatedJobValue)}
            </div>
            <div className="text-sm font-bold text-slate-600">
              <span className="mr-1 text-[0.6rem] font-black uppercase tracking-wide text-slate-400 md:hidden">Rate</span>
              {isCustom ? 'Custom' : formatRate(commission.adminTotalCommissionRate ?? 0)}
            </div>
            <LedgerProgress label="Rep" paid={commission.repPaidCommission} owed={repEstimatedCommission} />
            <LedgerProgress label="You" paid={adminReceived} owed={adminNet} />
            <div>
              {clock.active && (
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-black ${clockChipTone[clock.status]}`}>
                  <AlarmClock className="h-3 w-3" />
                  {clock.status === 'settled'
                    ? 'Settled'
                    : clock.status === 'overdue'
                      ? `${Math.abs(clock.daysRemaining)}d late`
                      : clock.status === 'due'
                        ? 'Pay Day'
                        : `${clock.daysRemaining}d left`}
                </span>
              )}
            </div>
            <ChevronDown
              className={`hidden h-4 w-4 text-slate-400 transition md:block ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {isOpen && (
            <div className="space-y-4 border-t border-slate-100 px-4 pb-5 pt-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                <EditorField label="Job value">
                  <CommitNumberInput
                    value={deal.estimatedJobValue}
                    round
                    className="w-full font-black text-[#1B3C6C]"
                    title="Sales price — edit to correct it; all commissions recalculate"
                    onCommit={(next) => updateDeal(deal.id, { estimatedJobValue: next }, currentUser)}
                  />
                </EditorField>
                <EditorField label="Total rate %">
                  {isCustom ? (
                    <span className="inline-block rounded-full bg-[#eef6ff] px-2.5 py-1 text-xs font-black text-[#1B3C6C]">Custom</span>
                  ) : (
                    <CommitNumberInput
                      value={(commission.adminTotalCommissionRate ?? 0) * 100}
                      step={0.5}
                      className="w-full"
                      onCommit={(v) =>
                        updateCommission(commission.id, { adminTotalCommissionRate: v / 100 }, currentUser)
                      }
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => updateCommission(commission.id, { customPayout: !isCustom }, currentUser)}
                    className="mt-1 block text-[0.6rem] font-black uppercase tracking-wide text-slate-400 transition hover:text-[#1B3C6C]"
                  >
                    {isCustom ? 'Use % rate' : 'Custom'}
                  </button>
                </EditorField>
                <EditorField label="Total commission">
                  <CommitNumberInput
                    value={commission.adminTotalEstimatedCommission ?? 0}
                    className="w-full"
                    onCommit={(v) =>
                      updateCommission(commission.id, { adminTotalEstimatedCommission: v }, currentUser)
                    }
                  />
                </EditorField>
                <EditorField label="Rep commission" tone="rep">
                  {isCustom ? (
                    <CommitNumberInput
                      value={commission.repEstimatedCommission}
                      className="w-full font-black text-slate-900"
                      title="Rep's cut on this custom deal"
                      onCommit={(v) =>
                        updateCommission(commission.id, { repEstimatedCommission: v }, currentUser)
                      }
                    />
                  ) : (
                    <p className="py-1.5 font-black">{formatCurrency(repEstimatedCommission)}</p>
                  )}
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Remaining {formatCurrency(Math.max(repEstimatedCommission - commission.repPaidCommission, 0))}
                  </p>
                </EditorField>
                <EditorField label="Paid to rep" tone="rep">
                  <CommitNumberInput
                    value={commission.repPaidCommission}
                    className="w-full"
                    onCommit={(v) => updateCommission(commission.id, { repPaidCommission: v }, currentUser)}
                  />
                  <div><PayoutBadge status={repStatus} /></div>
                </EditorField>
                <EditorField label="You received" tone="me">
                  <CommitNumberInput
                    value={adminReceived}
                    className="w-full"
                    onCommit={(v) => updateCommission(commission.id, { adminNetPaidCommission: v }, currentUser)}
                  />
                  <div><PayoutBadge status={adminStatus} /></div>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Your net {formatCurrency(adminNet)} · remaining {formatCurrency(Math.max(adminNet - adminReceived, 0))}
                  </p>
                </EditorField>
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                {/* One share applied to both ledgers — the rep's cut and your
                    net — so the two can't be filled in out of step. */}
                <div className="rounded-[0.5rem] border border-slate-200 bg-white p-3">
                  <p className="text-[0.6rem] font-black uppercase tracking-[0.14em] text-[#32639b]">
                    Commission paid so far
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {[0, ...UPFRONT_PRESETS, 1].map((fraction) => {
                      const value = Math.round(fraction * 100);
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => recordShare(fraction)}
                          className={
                            paidPercent === value
                              ? 'rounded-full bg-[#1B3C6C] px-3 py-1 text-xs font-black text-white'
                              : 'rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-600 transition hover:text-[#1B3C6C]'
                          }
                        >
                          {value === 100 ? 'Paid in full' : `${value}%`}
                        </button>
                      );
                    })}
                    <span className="inline-flex items-center gap-1 text-xs font-black text-slate-500">
                      <CommitNumberInput
                        value={paidPercent}
                        step={1}
                        className="w-16 py-1 text-xs"
                        title="Custom share paid, applied to the rep and to you"
                        onCommit={(v) => recordShare(Math.min(v, 100) / 100)}
                      />
                      %
                    </span>
                  </div>
                  <p className="mt-2 text-[0.68rem] font-semibold leading-4 text-slate-500">
                    Sets the rep's paid amount and yours to the same share of each.
                  </p>
                </div>
                <div className="rounded-[0.5rem] border border-slate-200 bg-white p-3">
                  <p className="text-[0.6rem] font-black uppercase tracking-[0.14em] text-[#32639b]">
                    {DEFAULT_BALANCE_CLOCK_DAYS}-day balance clock
                  </p>
                  <div className="mt-2">
                    <BalanceClockControl
                      variant="panel"
                      commission={{ ...commission, ...ledger }}
                      canEdit={currentUser?.role === 'admin'}
                      onChange={(updates) => updateCommission(commission.id, updates, currentUser)}
                    />
                  </div>
                </div>
                <div className="flex items-start">
                  <button
                    type="button"
                    onClick={() => navigate('/portal/deals', { state: { openDealId: deal.id } })}
                    className="inline-flex items-center gap-1.5 rounded-[0.5rem] border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:border-[#32639b] hover:text-[#1B3C6C]"
                  >
                    Open deal
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#32639b]">
              Commission Center
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.02em]">
              Admin payout visibility
            </h1>
          </div>
          <label className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search homeowner, rep, contractor…"
              aria-label="Search commissions"
              className="w-full rounded-[0.5rem] border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm font-semibold shadow-sm focus:border-[#32639b] focus:outline-none focus:ring-2 focus:ring-[#32639b]/20"
            />
          </label>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metricCard(
            'Owed to Reps',
            formatCurrency(totals.pendingRep),
            isFiltered ? `${filterLabel} · rep commission still unpaid` : 'Rep commission still unpaid on won deals',
            HandCoins
          )}
          {metricCard(
            'Owed to You (net)',
            formatCurrency(totals.adminNetPending),
            isFiltered ? `${filterLabel} · your net not yet collected` : 'Your net not yet collected from contractors',
            BadgeDollarSign
          )}
          {metricCard(
            'Total Projected Commission',
            formatCurrency(totals.projected),
            isFiltered ? `${filterLabel} deals only` : 'All active projected deals',
            TrendingUp
          )}
          <article className="rounded-[0.5rem] border border-white bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="inline-flex rounded-full bg-slate-100 p-0.5">
                  {(['reps', 'me'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setPayoutView(v)}
                      className={
                        payoutView === v
                          ? 'rounded-full bg-[#1B3C6C] px-3 py-1 text-xs font-black text-white'
                          : 'rounded-full px-3 py-1 text-xs font-black text-slate-500 transition hover:text-slate-700'
                      }
                    >
                      {v === 'reps' ? 'Reps' : 'Me'}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-3xl font-black tracking-[-0.02em] text-slate-950">
                  {formatCurrency(payoutView === 'reps' ? totals.paidOut : totals.paidToMe)}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-[0.5rem] bg-[#e8f1fb] text-[#1B3C6C]">
                <Banknote className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-sm font-medium text-slate-500">
              {payoutView === 'reps'
                ? (isFiltered ? `${filterLabel} · paid out to reps` : 'Paid out to reps (recorded)')
                : (isFiltered ? `${filterLabel} · your net collected` : 'Your net collected (recorded)')}
            </p>
          </article>
        </section>

        {needsInvoice.length > 0 && (
          <section className="rounded-[0.5rem] border border-red-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-red-600">
              Needs invoicing · {needsInvoice.length}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Won, but never invoiced to the contractor, or invoiced at a different price than the deal shows now.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {needsInvoice.map(({ commission, deal, check }) => (
                <button
                  key={commission.id}
                  type="button"
                  onClick={() => focusCommission(commission.id)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-[#fbfdff] py-1 pl-3 pr-1 text-xs font-black text-slate-800 transition hover:border-red-300 hover:bg-red-50"
                >
                  {deal.homeownerName}
                  <span className="font-semibold text-slate-500">
                    {deal.projectType} · {formatCurrency(deal.estimatedJobValue)}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[0.65rem] ${
                      check.state === 'never_invoiced' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {check.state === 'mismatch' ? `invoiced ${formatCurrency(check.invoicedPrice)}` : 'not invoiced'}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {clockShortcuts.length > 0 && (
          <section className="rounded-[0.5rem] border border-white bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#32639b]">
              {DEFAULT_BALANCE_CLOCK_DAYS}-Day Payouts · {clockShortcuts.length}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {clockShortcuts.map(({ commission, deal, clock, outstanding }) => (
                <button
                  key={commission.id}
                  type="button"
                  onClick={() => focusCommission(commission.id)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-[#fbfdff] py-1 pl-3 pr-1 text-xs font-black text-slate-800 transition hover:border-[#32639b] hover:bg-[#f6faff]"
                >
                  {deal.homeownerName || 'Deal'}
                  {outstanding !== null && (
                    <span className="font-bold text-slate-500">{formatCurrency(outstanding)}</span>
                  )}
                  <span className={`rounded-full px-2 py-0.5 text-[0.65rem] ${clockChipTone[clock.status]}`}>
                    {clock.status === 'overdue'
                      ? `${Math.abs(clock.daysRemaining)}d late`
                      : clock.status === 'due'
                        ? 'Pay Day'
                        : `${clock.daysRemaining}d`}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Filters — drive the cards and every section below. */}
        <section className="flex flex-wrap items-center gap-2 rounded-[0.5rem] border border-white bg-white p-3 shadow-sm">
          <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
            Status
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as DealStatus | 'all')} className={selectClass}>
              {statusFilterOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
            Year
            <select
              value={String(yearFilter)}
              onChange={(e) => setYearFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className={selectClass}
            >
              <option value="all">All years</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
            Payment
            <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value as PaymentFilter)} className={selectClass}>
              {paymentFilterOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <SortButton mode={sortMode} onClick={() => setSortMode(nextSortMode(sortMode))} />
          <span className="ml-auto text-sm font-bold text-slate-400">
            {filteredRows.length} deal{filteredRows.length !== 1 ? 's' : ''}
          </span>
          <button
            type="button"
            onClick={() => setShowRateSettings((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-[0.5rem] border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            <Settings2 className="h-4 w-4 text-slate-400" />
            Default rate {formatRate(defaultCommissionRate)}
          </button>
          {showRateSettings && (
            <div className="flex w-full flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
              <span className="text-sm font-semibold text-slate-500">Default rate:</span>
              <div className="relative w-28">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={rateInput}
                  onChange={(e) => setRateInput(e.target.value)}
                  className="w-full rounded-[0.5rem] border border-slate-300 py-1.5 pl-3 pr-7 text-sm font-bold focus:border-[#32639b] focus:outline-none focus:ring-2 focus:ring-[#32639b]/20"
                />
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">%</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const val = parseFloat(rateInput);
                  if (isNaN(val) || val < 0 || val > 100) return;
                  const rate = val / 100;
                  // Historical deals carry the rate they were actually paid
                  // at (7%, 7.5%, 8%) — rewriting those rewrites history.
                  // Custom one-off payouts are left alone too.
                  const targets = visibleCommissions.filter((c) => {
                    const deal = getDeal(c.dealId);
                    return deal && !c.customPayout && !deal.isHistorical;
                  });
                  if (!window.confirm(`Set ${targets.length} deals to ${val}%? Historical and custom-payout deals are left as they are.`)) return;
                  setDefaultCommissionRate(rate);
                  targets.forEach((c) => {
                    const deal = getDeal(c.dealId)!;
                    const newTotal = Math.round(commissionableValue(deal) * rate);
                    updateCommission(c.id, {
                      adminTotalCommissionRate: rate,
                      adminTotalEstimatedCommission: newTotal,
                    }, currentUser ?? undefined);
                  });
                  setRateSaved(true);
                  setTimeout(() => setRateSaved(false), 3000);
                }}
                className="rounded-[0.5rem] bg-[#1B3C6C] px-3 py-1.5 text-sm font-bold text-white transition hover:bg-[#153158]"
              >
                Apply to All
              </button>
              {rateSaved && <span className="text-sm font-bold text-green-600">Saved!</span>}
            </div>
          )}
        </section>

        {filteredRows.length === 0 && (
          <p className="rounded-[0.5rem] border border-dashed border-slate-300 bg-white p-6 text-center text-sm font-semibold text-slate-500">
            {searching ? `No deals match "${search.trim()}".` : 'No deals match these filters.'}
          </p>
        )}

        {grouped.map(({ key, rows }) => {
          if (rows.length === 0) return null;
          const meta = sectionMeta[key];
          // A section opens itself while searching, or when it holds the deal
          // you just jumped to — a collapsed section must never hide that.
          const open =
            searching || !collapsed.includes(key) || rows.some((r) => r.commission.id === expandedId);
          const owedRep = rows.reduce(
            (sum, { commission, deal }) =>
              sum + Math.max(
                (commission.customPayout ? commission.repEstimatedCommission : calculateRepEstimatedCommission(deal!)) -
                  commission.repPaidCommission,
                0
              ),
            0
          );
          const owedMe = rows.reduce((sum, { commission, deal }) => {
            const repEst = commission.customPayout ? commission.repEstimatedCommission : calculateRepEstimatedCommission(deal!);
            const net = (commission.adminTotalEstimatedCommission ?? 0) - repEst;
            return sum + Math.max(net - (commission.adminNetPaidCommission ?? 0), 0);
          }, 0);
          return (
            <section key={key} className="overflow-hidden rounded-[0.5rem] border border-white bg-white shadow-sm">
              <button
                type="button"
                onClick={() =>
                  setCollapsed((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]))
                }
                className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 border-b border-slate-200 px-4 py-3 text-left transition hover:bg-slate-50"
              >
                <ChevronDown className={`h-4 w-4 text-slate-400 transition ${open ? '' : '-rotate-90'}`} />
                <h2 className="text-lg font-black tracking-[-0.01em]">{meta.title}</h2>
                <span className="rounded-full bg-[#e8f1fb] px-2 py-0.5 text-xs font-black text-[#1B3C6C]">{rows.length}</span>
                <span className="text-sm font-semibold text-slate-400">{meta.hint}</span>
                {key === 'awaiting' && (
                  <span className="ml-auto text-sm font-bold text-slate-500">
                    Owed to reps <span className="font-black text-slate-900">{formatCurrency(owedRep)}</span>
                    {' · '}to you <span className="font-black text-slate-900">{formatCurrency(owedMe)}</span>
                  </span>
                )}
              </button>
              {open && (
                <>
                  <div className="hidden grid-cols-[minmax(0,2.2fr)_6.5rem_6.5rem_4rem_minmax(0,1.2fr)_minmax(0,1.2fr)_6.5rem_1rem] gap-x-4 bg-slate-50 px-4 py-2 text-[0.65rem] font-black uppercase tracking-[0.12em] text-slate-500 md:grid">
                    <span>Deal · contractor · rep</span>
                    <span>Status</span>
                    <span>Job value</span>
                    <span>Rate</span>
                    <span>Rep 5%</span>
                    <span>Your net</span>
                    <span>Clock</span>
                    <span />
                  </div>
                  <div className="divide-y divide-slate-100">{rows.map(renderRow)}</div>
                </>
              )}
            </section>
          );
        })}

        {invoices.length > 0 && (
          <section className="overflow-hidden rounded-[0.5rem] border border-white bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#32639b]">Invoice History ({invoices.length})</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-500">Commission invoices you’ve sent, most recent first. Click a row to re-open it.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-black uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-2">Invoice</th>
                    <th className="px-4 py-2">Customer</th>
                    <th className="hidden px-4 py-2 sm:table-cell">Contractor</th>
                    <th className="px-4 py-2 text-right">Net</th>
                    <th className="hidden px-4 py-2 sm:table-cell">Sent to</th>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      onClick={() => openInvoice(inv)}
                      className="cursor-pointer border-b border-slate-50 transition hover:bg-[#f6faff]"
                    >
                      <td className="px-4 py-2 font-black text-slate-900">#{inv.invoiceNumber ?? '—'}</td>
                      <td className="px-4 py-2 font-semibold text-slate-700">
                        {inv.customerName || '—'}
                        <span className="block text-xs text-slate-400 sm:hidden">{inv.contractorName || '—'}</span>
                      </td>
                      <td className="hidden px-4 py-2 font-semibold text-slate-700 sm:table-cell">{inv.contractorName || '—'}</td>
                      <td className="px-4 py-2 text-right font-black text-slate-900">
                        {formatCurrency(inv.netAmount)}
                        {inv.adjustmentsTotal !== 0 && (
                          <span className="ml-1 hidden text-xs font-semibold text-slate-400 sm:inline">(adj {formatCurrency(inv.adjustmentsTotal)})</span>
                        )}
                      </td>
                      <td className="hidden px-4 py-2 font-semibold text-slate-500 sm:table-cell">{inv.sentTo || '—'}</td>
                      <td className="whitespace-nowrap px-4 py-2 font-semibold text-slate-500">
                        {new Date(inv.createdAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleDeleteInvoice(inv); }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-300 transition hover:bg-red-50 hover:text-red-500"
                          aria-label="Delete invoice record"
                          title="Remove from history"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {viewingInvoice && (
          <Suspense fallback={null}>
            <InvoiceViewer data={viewingInvoice} onClose={() => setViewingInvoice(null)} />
          </Suspense>
        )}
      </div>
    );
  }

  const repRows = visibleCommissions
    .map((commission) => ({
      commission,
      deal: visibleDeals.find((deal) => deal.id === commission.dealId),
    }))
    .filter((row) => row.deal);

  const repYearSet = new Set<number>(repRows.map((r) => dealYear(r.deal!)));
  repYearSet.add(Number(torontoToday().slice(0, 4)));
  const repAvailableYears = Array.from(repYearSet).sort((a, b) => b - a);

  const repFilteredRows = repRows.filter(
    (row) =>
      (statusFilter === 'all' || row.deal!.status === statusFilter) &&
      (yearFilter === 'all' || new Date(row.deal!.updatedAt).getFullYear() === yearFilter) &&
      (paymentFilter === 'all' || repPaymentStatus(row.commission, row.deal!) === paymentFilter) &&
      matchesSearch(search, [
        row.deal!.homeownerName,
        row.deal!.projectType,
        row.deal!.city,
        row.deal!.address,
        getContractorName(row.deal),
      ])
  );
  const repIsFiltered =
    statusFilter !== 'all' || yearFilter !== 'all' || paymentFilter !== 'all' || search.trim() !== '';
  const repFilterLabel =
    statusFilterOptions.find((o) => o.value === statusFilter)?.label ?? 'All statuses';

  // When filtered, recompute the cards from the visible rows; otherwise keep the
  // exact store totals so the default view is unchanged.
  const repTotals = repIsFiltered
    ? repFilteredRows.reduce(
        (acc, { commission, deal }) => {
          if (!deal) return acc;
          acc.paid += commission.repPaidCommission;
          if (!deal.isHistorical && projectedStatuses.includes(deal.status)) {
            acc.projected += commission.repEstimatedCommission;
          }
          if (deal.status === 'won' && !deal.isHistorical && commission.payoutStatus !== 'paid') {
            acc.pending += Math.max(commission.repEstimatedCommission - commission.repPaidCommission, 0);
          }
          if (!deal.isHistorical && openDealStatuses.includes(deal.status)) {
            acc.pipeline += deal.estimatedJobValue;
          }
          return acc;
        },
        { pending: 0, projected: 0, paid: 0, pipeline: 0 }
      )
    : {
        pending: calculateRepPendingCommission(currentUser.id),
        projected: calculateRepProjectedCommission(currentUser.id),
        paid: calculateRepPaidCommission(currentUser.id),
        pipeline: calculatePipelineValue(currentUser.id),
      };

  return (
    <div className="space-y-6">
      <header className="rounded-[0.5rem] border border-white bg-[linear-gradient(135deg,#ffffff_0%,#f7fbff_55%,#ecf4fd_100%)] p-5 shadow-md sm:p-7">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#32639b]">
          Commission Center
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.02em] text-slate-950 sm:text-4xl">
          Your commission scoreboard, {currentUser.name}.
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          Track projected payouts, won-deal commission, and rep payments from
          your local CRM pipeline.
        </p>
      </header>

      {/* Status / Year / Payment filters — drive both the cards and the deal list */}
      <section className="flex flex-wrap items-center gap-2 rounded-[0.5rem] border border-white bg-white p-3 shadow-sm">
        <label className="relative w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search homeowner, project, contractor…"
            aria-label="Search your commissions"
            className="w-full rounded-[0.5rem] border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm font-semibold focus:border-[#32639b] focus:outline-none focus:ring-2 focus:ring-[#32639b]/20"
          />
        </label>
        <span className="mr-1 text-xs font-black uppercase tracking-[0.12em] text-slate-400">Showing</span>
        {statusFilterOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setStatusFilter(option.value)}
            className={
              statusFilter === option.value
                ? 'rounded-full bg-[#1B3C6C] px-3.5 py-1.5 text-xs font-black text-white'
                : 'rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-black text-slate-600 transition hover:text-[#1B3C6C]'
            }
          >
            {option.label}
          </button>
        ))}

        <span className="mx-1 hidden h-5 w-px bg-slate-200 sm:block" aria-hidden />
        <span className="mr-1 text-xs font-black uppercase tracking-[0.12em] text-slate-400">Year</span>
        {([{ label: 'All years', value: 'all' as const }, ...repAvailableYears.map((y) => ({ label: String(y), value: y }))] as Array<{ label: string; value: number | 'all' }>).map((option) => (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => setYearFilter(option.value)}
            className={
              yearFilter === option.value
                ? 'rounded-full bg-[#1B3C6C] px-3.5 py-1.5 text-xs font-black text-white'
                : 'rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-black text-slate-600 transition hover:text-[#1B3C6C]'
            }
          >
            {option.label}
          </button>
        ))}

        <span className="mx-1 hidden h-5 w-px bg-slate-200 sm:block" aria-hidden />
        <span className="mr-1 text-xs font-black uppercase tracking-[0.12em] text-slate-400">Payment</span>
        {paymentFilterOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setPaymentFilter(option.value)}
            className={
              paymentFilter === option.value
                ? 'rounded-full bg-[#1B3C6C] px-3.5 py-1.5 text-xs font-black text-white'
                : 'rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-black text-slate-600 transition hover:text-[#1B3C6C]'
            }
          >
            {option.label}
          </button>
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCard(
          'Pending Commission',
          formatCurrency(repTotals.pending),
          repIsFiltered ? `${repFilterLabel} · unpaid won deals` : 'Unpaid or partial won deals',
          HandCoins
        )}
        {metricCard(
          'Projected Commission',
          formatCurrency(repTotals.projected),
          repIsFiltered ? `${repFilterLabel} deals at 5%` : 'Active deals at 5%',
          TrendingUp
        )}
        {metricCard(
          'Paid Commission',
          formatCurrency(repTotals.paid),
          repIsFiltered ? `${repFilterLabel} · recorded payouts` : 'Recorded payouts',
          Banknote
        )}
        {metricCard(
          'Pipeline Value',
          formatCurrency(repTotals.pipeline),
          'Open renovation deal value',
          CircleDollarSign
        )}
      </section>

      <section className="rounded-[0.5rem] border border-white bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <h2 className="text-lg font-black tracking-[-0.01em]">
            Commission by Deal
            <span className="ml-2 text-sm font-bold text-slate-400">
              {repFilteredRows.length} {repIsFiltered ? repFilterLabel.toLowerCase() : ''} deal{repFilteredRows.length !== 1 ? 's' : ''}{yearFilter !== 'all' ? ` · ${yearFilter}` : ''}{paymentFilter !== 'all' ? ` · ${paymentFilter}` : ''}
            </span>
          </h2>
          <SortButton mode={sortMode} onClick={() => setSortMode(nextSortMode(sortMode))} />
        </div>
        {repFilteredRows.length === 0 ? (
          <p className="mt-4 rounded-[0.5rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">
            No {repIsFiltered ? repFilterLabel.toLowerCase() : ''} deals to show.
          </p>
        ) : (
        <div className="mt-4 grid gap-3">
          {sortCommissionRows(repFilteredRows, sortMode).map(({ commission, deal }) => {
            if (!deal) return null;
            const repEstimatedCommission = commission.customPayout
              ? commission.repEstimatedCommission
              : calculateRepEstimatedCommission(deal);
            const remaining = Math.max(
              repEstimatedCommission - commission.repPaidCommission,
              0
            );

            return (
              <article
                key={commission.id}
                className="rounded-[0.5rem] border border-slate-200 bg-[#fbfdff] p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-950">
                      {deal.homeownerName}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {deal.projectType} - {formatDealStatus(deal.status)}
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      Contractor: {getContractorName(deal)}
                    </p>
                  </div>
                  <div className="rounded-[0.5rem] bg-[#e8f1fb] px-4 py-3 text-[#1B3C6C]">
                    <p className="text-xs font-bold uppercase tracking-[0.12em]">
                      Rep estimated commission
                    </p>
                    <p className="mt-1 text-2xl font-black">
                      {formatCurrency(repEstimatedCommission)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                      Estimated job value
                    </p>
                    <p className="mt-1 font-black">
                      {formatCurrency(deal.estimatedJobValue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                      Paid amount
                    </p>
                    <p className="mt-1 font-black">
                      {formatCurrency(commission.repPaidCommission)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                      Remaining payout
                    </p>
                    <p className="mt-1 font-black">
                      {formatCurrency(remaining)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                      Payout status
                    </p>
                    <p className="mt-1 font-black capitalize">
                      {commission.payoutStatus}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                      Deal status
                    </p>
                    <p className="mt-1 font-black">
                      {formatDealStatus(deal.status)}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        )}
      </section>
    </div>
  );
}
