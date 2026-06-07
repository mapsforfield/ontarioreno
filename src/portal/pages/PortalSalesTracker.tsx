import { Archive, Plus, Trash2 } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { usePortalAuth } from '../auth';
import { formatCurrency } from '../data/selectors';
import { usePortalData } from '../data/store';
import { SaleTrackerRow } from '../data/types';

const FUNDED_OPTIONS = ['', 'YES', 'PARTIALLY', 'NO'] as const;
const PAYMENT_OPTIONS = ['', 'Finance', 'Cash', 'Finance and Cash'] as const;

function cls(...args: (string | false | null | undefined)[]) {
  return args.filter(Boolean).join(' ');
}

// ── Inline cell components ────────────────────────────────────────────────────

type CellProps = {
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  placeholder?: string;
  className?: string;
  wide?: boolean;
};

function TextCell({ value, onChange, onBlur, placeholder, className, wide }: CellProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      className={cls(
        'h-full w-full min-w-0 bg-transparent px-2 py-1.5 text-sm text-slate-800',
        'placeholder:text-slate-300 outline-none',
        'focus:bg-white focus:ring-1 focus:ring-inset focus:ring-[#1B3C6C] focus:rounded-sm',
        wide && 'min-w-[180px]',
        className
      )}
    />
  );
}

type SelectCellProps = {
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
  onBlur: () => void;
  colorMap?: Record<string, string>;
};

function SelectCell({ value, options, onChange, onBlur, colorMap }: SelectCellProps) {
  const color = colorMap?.[value] ?? '';
  return (
    <select
      value={value}
      onChange={(e) => { onChange(e.target.value); onBlur(); }}
      onBlur={onBlur}
      className={cls(
        'h-full w-full min-w-0 bg-transparent px-2 py-1.5 text-sm font-semibold outline-none cursor-pointer',
        'focus:bg-white focus:ring-1 focus:ring-inset focus:ring-[#1B3C6C] focus:rounded-sm',
        color
      )}
    >
      {options.map((o) => (
        <option key={o} value={o}>{o || '—'}</option>
      ))}
    </select>
  );
}

const fundedColors: Record<string, string> = {
  YES: 'text-emerald-700',
  PARTIALLY: 'text-amber-700',
  NO: 'text-red-600',
};

// ── Row component ─────────────────────────────────────────────────────────────

type RowProps = {
  row: SaleTrackerRow;
  onSave: (id: string, updates: Partial<SaleTrackerRow>) => void;
  onDelete: (id: string) => void;
  showRepName: boolean;
  repName: string;
  isAdmin: boolean;
};

function TrackerRow({ row, onSave, onDelete, showRepName, repName, isAdmin }: RowProps) {
  const [local, setLocal] = useState<SaleTrackerRow>(row);
  const dirty = useRef<Partial<SaleTrackerRow>>({});

  const set = useCallback(<K extends keyof SaleTrackerRow>(field: K, value: SaleTrackerRow[K]) => {
    setLocal((prev) => ({ ...prev, [field]: value }));
    dirty.current = { ...dirty.current, [field]: value };
  }, []);

  const flush = useCallback(() => {
    if (Object.keys(dirty.current).length === 0) return;
    onSave(row.id, { ...dirty.current });
    dirty.current = {};
  }, [onSave, row.id]);

  const td = 'border-r border-slate-100 last:border-r-0 h-9';

  return (
    <tr className={cls(
      'group border-b border-slate-100 hover:bg-slate-50/60 transition-colors',
      local.onHold && 'bg-amber-50/40'
    )}>
      {showRepName && (
        <td className={cls(td, 'px-2 text-xs font-semibold text-slate-500 whitespace-nowrap min-w-[80px]')}>
          {repName}
        </td>
      )}
      <td className={td}>
        <TextCell value={local.clientName} onChange={(v) => set('clientName', v)} onBlur={flush} placeholder="Client name" wide />
      </td>
      <td className={cls(td, 'text-right min-w-[100px]')}>
        <input
          type="number"
          value={local.projectTotal || ''}
          onChange={(e) => set('projectTotal', parseFloat(e.target.value) || 0)}
          onBlur={flush}
          placeholder="0"
          className="h-full w-full bg-transparent px-2 py-1.5 text-right text-sm font-bold text-[#1B3C6C] outline-none focus:bg-white focus:ring-1 focus:ring-inset focus:ring-[#1B3C6C] focus:rounded-sm"
        />
      </td>
      <td className={cls(td, 'min-w-[120px]')}>
        <SelectCell
          value={local.paymentType}
          options={PAYMENT_OPTIONS}
          onChange={(v) => set('paymentType', v)}
          onBlur={flush}
        />
      </td>
      <td className={cls(td, 'min-w-[100px]')}>
        <TextCell value={local.city} onChange={(v) => set('city', v)} onBlur={flush} placeholder="City" />
      </td>
      <td className={cls(td, 'min-w-[90px]')}>
        <TextCell value={local.startDate} onChange={(v) => set('startDate', v)} onBlur={flush} placeholder="Start" />
      </td>
      <td className={cls(td, 'min-w-[220px]')}>
        <TextCell value={local.signingStatus} onChange={(v) => set('signingStatus', v)} onBlur={flush} placeholder="Signing / status notes" wide />
      </td>
      <td className={cls(td, 'min-w-[130px]')}>
        <TextCell value={local.approvalStatus} onChange={(v) => set('approvalStatus', v)} onBlur={flush} placeholder="Approved / N/A" />
      </td>
      <td className={cls(td, 'min-w-[100px]')}>
        <SelectCell
          value={local.fundedStatus}
          options={FUNDED_OPTIONS}
          onChange={(v) => set('fundedStatus', v as SaleTrackerRow['fundedStatus'])}
          onBlur={flush}
          colorMap={fundedColors}
        />
      </td>
      <td className={cls(td, 'min-w-[110px]')}>
        <input
          type="number"
          value={local.amountLeftToPay ?? ''}
          onChange={(e) => set('amountLeftToPay', e.target.value ? parseFloat(e.target.value) : null)}
          onBlur={flush}
          placeholder="—"
          className="h-full w-full bg-transparent px-2 py-1.5 text-right text-sm text-amber-700 font-semibold outline-none focus:bg-white focus:ring-1 focus:ring-inset focus:ring-[#1B3C6C] focus:rounded-sm"
        />
      </td>
      <td className={cls(td, 'min-w-[160px]')}>
        <TextCell value={local.notes} onChange={(v) => set('notes', v)} onBlur={flush} placeholder="Notes" />
      </td>
      <td className={cls(td, 'min-w-[70px] text-center')}>
        <button
          type="button"
          onClick={() => { set('onHold', !local.onHold); setTimeout(flush, 0); }}
          className={cls(
            'px-2 py-0.5 rounded text-[0.65rem] font-black uppercase tracking-wide transition',
            local.onHold
              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
              : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'
          )}
        >
          {local.onHold ? 'On Hold' : 'Hold'}
        </button>
      </td>
      <td className="border-r-0 w-8 text-center">
        <button
          type="button"
          onClick={() => onDelete(row.id)}
          className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition"
          aria-label="Delete row"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </td>
    </tr>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PortalSalesTracker() {
  const { currentUser, isAdmin } = usePortalAuth();
  const { trackerRows, users, addTrackerRow, updateTrackerRow, deleteTrackerRow } = usePortalData();
  const [repFilter, setRepFilter] = useState<string>('all');
  const [showOnHold, setShowOnHold] = useState(false);

  if (!currentUser) return null;

  const reps = users.filter((u) => u.role === 'rep' && u.active);

  // Which rep's rows to show
  const myRows = isAdmin
    ? trackerRows
    : trackerRows.filter((r) => r.repId === currentUser.id);

  const filteredRows = myRows
    .filter((r) => showOnHold ? r.onHold : !r.onHold)
    .filter((r) => repFilter === 'all' || r.repId === repFilter)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));

  // Stats
  const statsRows = isAdmin && repFilter !== 'all'
    ? myRows.filter((r) => r.repId === repFilter && !r.onHold)
    : myRows.filter((r) => !r.onHold);

  const totalVolume = statsRows.reduce((s, r) => s + r.projectTotal, 0);
  const fundedYes = statsRows.filter((r) => r.fundedStatus === 'YES').length;
  const fundedPartial = statsRows.filter((r) => r.fundedStatus === 'PARTIALLY');
  const totalOwing = fundedPartial.reduce((s, r) => s + (r.amountLeftToPay ?? 0), 0);
  const onHoldCount = myRows.filter((r) => r.onHold && (repFilter === 'all' || r.repId === repFilter)).length;

  const handleSave = (id: string, updates: Partial<SaleTrackerRow>) => {
    void updateTrackerRow(id, updates);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this row?')) return;
    void deleteTrackerRow(id);
  };

  const handleAddRow = () => {
    const repId = isAdmin && repFilter !== 'all' ? repFilter : currentUser.id;
    void addTrackerRow(repId);
  };

  const getRepName = (repId: string) => users.find((u) => u.id === repId)?.name ?? repId;

  const thCls = 'px-2 py-2 text-left text-[0.65rem] font-black uppercase tracking-[0.1em] text-slate-400 border-r border-slate-200 last:border-r-0 whitespace-nowrap select-none';

  return (
    <div className="flex flex-col gap-5">
      {/* ── Header ── */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#32639b]">
            Personal CRM
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.02em]">
            My Sales Tracker
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <select
              value={repFilter}
              onChange={(e) => setRepFilter(e.target.value)}
              className="rounded-[0.5rem] border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 focus:border-[#1B3C6C] focus:outline-none"
            >
              <option value="all">All reps</option>
              {reps.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={() => setShowOnHold((v) => !v)}
            className={cls(
              'flex items-center gap-1.5 rounded-[0.5rem] border px-3 py-2 text-sm font-bold transition',
              showOnHold
                ? 'border-amber-300 bg-amber-50 text-amber-700'
                : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
            )}
          >
            <Archive className="h-3.5 w-3.5" />
            On Hold {onHoldCount > 0 && `(${onHoldCount})`}
          </button>
          <button
            type="button"
            onClick={handleAddRow}
            className="flex items-center gap-2 rounded-[0.5rem] bg-[#1B3C6C] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#153158]"
          >
            <Plus className="h-4 w-4" />
            Add Row
          </button>
        </div>
      </header>

      {/* ── Stats bar ── */}
      {!showOnHold && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-[0.5rem] border border-white bg-white p-3 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">Total Deals</p>
            <p className="mt-1.5 text-2xl font-black text-slate-950">{statsRows.length}</p>
          </div>
          <div className="rounded-[0.5rem] border border-white bg-white p-3 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">Project Volume</p>
            <p className="mt-1.5 text-xl font-black text-[#1B3C6C]">{formatCurrency(totalVolume)}</p>
          </div>
          <div className="rounded-[0.5rem] border border-white bg-white p-3 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">Fully Funded</p>
            <p className="mt-1.5 text-2xl font-black text-emerald-600">{fundedYes}</p>
          </div>
          {totalOwing > 0 ? (
            <div className="rounded-[0.5rem] border border-amber-200 bg-amber-50 p-3 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-amber-500">Partial — Owing</p>
              <p className="mt-1.5 text-xl font-black text-amber-700">{formatCurrency(totalOwing)}</p>
              <p className="text-xs font-semibold text-amber-500">{fundedPartial.length} deal{fundedPartial.length !== 1 ? 's' : ''}</p>
            </div>
          ) : (
            <div className="rounded-[0.5rem] border border-white bg-white p-3 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">Partial Funded</p>
              <p className="mt-1.5 text-2xl font-black text-amber-600">{fundedPartial.length}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Table ── */}
      <div className="rounded-[0.5rem] border border-white bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-slate-50 border-b-2 border-slate-200">
              <tr>
                {isAdmin && <th className={thCls}>Rep</th>}
                <th className={thCls}>Client Name</th>
                <th className={cls(thCls, 'text-right')}>Project Total</th>
                <th className={thCls}>Payment Type</th>
                <th className={thCls}>City</th>
                <th className={thCls}>Start Date</th>
                <th className={thCls}>Status / Signing Details</th>
                <th className={thCls}>Approval Status</th>
                <th className={thCls}>Funded</th>
                <th className={cls(thCls, 'text-right')}>Left to Pay</th>
                <th className={thCls}>Notes</th>
                <th className={thCls}>Hold</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 13 : 12}
                    className="py-16 text-center text-sm font-semibold text-slate-400"
                  >
                    {showOnHold ? 'No deals on hold.' : 'No rows yet — click Add Row to get started.'}
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <TrackerRow
                    key={row.id}
                    row={row}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    showRepName={isAdmin}
                    repName={getRepName(row.repId)}
                    isAdmin={isAdmin}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Add row footer */}
        <div className="border-t border-slate-100 px-3 py-2">
          <button
            type="button"
            onClick={handleAddRow}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-[#1B3C6C] transition"
          >
            <Plus className="h-3.5 w-3.5" />
            Add row
          </button>
        </div>
      </div>

      <p className="text-xs font-semibold text-slate-400 text-center">
        Click any cell to edit · Changes save automatically · Tab between fields
      </p>
    </div>
  );
}
