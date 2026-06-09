import { Archive, ChevronDown, ChevronRight, ChevronUp, Plus, Trash2, X } from 'lucide-react';
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

const fundedColors: Record<string, string> = {
  YES: 'text-emerald-700',
  PARTIALLY: 'text-amber-700',
  NO: 'text-red-600',
};

const fundedBadge: Record<string, string> = {
  YES: 'bg-emerald-100 text-emerald-700',
  PARTIALLY: 'bg-amber-100 text-amber-700',
  NO: 'bg-red-100 text-red-700',
};

// ── Desktop inline cell components ───────────────────────────────────────────

type CellProps = {
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  placeholder?: string;
  className?: string;
};

function TextCell({ value, onChange, onBlur, placeholder, className }: CellProps) {
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

// ── Desktop table row ─────────────────────────────────────────────────────────

type RowProps = {
  row: SaleTrackerRow;
  onSave: (id: string, updates: Partial<SaleTrackerRow>) => void;
  onDelete: (id: string) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  showRepName: boolean;
  repName: string;
};

function TrackerRow({ row, onSave, onDelete, onMoveUp, onMoveDown, showRepName, repName }: RowProps) {
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
      {/* ↑↓ reorder buttons */}
      <td className="border-r border-slate-100 w-7 text-center">
        <div className="flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!onMoveUp}
            className="p-0.5 text-slate-300 hover:text-[#1B3C6C] disabled:opacity-0 disabled:pointer-events-none transition"
            aria-label="Move up"
          >
            <ChevronUp className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!onMoveDown}
            className="p-0.5 text-slate-300 hover:text-[#1B3C6C] disabled:opacity-0 disabled:pointer-events-none transition"
            aria-label="Move down"
          >
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      </td>
      {showRepName && (
        <td className={cls(td, 'px-2 text-xs font-semibold text-slate-500 whitespace-nowrap w-[90px]')}>
          {repName}
        </td>
      )}
      <td className={cls(td, 'w-[160px]')}>
        <TextCell value={local.clientName} onChange={(v) => set('clientName', v)} onBlur={flush} placeholder="Client name" />
      </td>
      <td className={cls(td, 'w-[110px] text-right')}>
        <input
          type="number"
          value={local.projectTotal || ''}
          onChange={(e) => set('projectTotal', parseFloat(e.target.value) || 0)}
          onBlur={flush}
          placeholder="0"
          className="h-full w-full bg-transparent px-2 py-1.5 text-right text-sm font-bold text-[#1B3C6C] outline-none focus:bg-white focus:ring-1 focus:ring-inset focus:ring-[#1B3C6C] focus:rounded-sm"
        />
      </td>
      <td className={cls(td, 'w-[140px]')}>
        <SelectCell value={local.paymentType} options={PAYMENT_OPTIONS} onChange={(v) => set('paymentType', v)} onBlur={flush} />
      </td>
      <td className={cls(td, 'w-[100px]')}>
        <TextCell value={local.city} onChange={(v) => set('city', v)} onBlur={flush} placeholder="City" />
      </td>
      <td className={cls(td, 'w-[90px]')}>
        <TextCell value={local.startDate} onChange={(v) => set('startDate', v)} onBlur={flush} placeholder="Start" />
      </td>
      <td className={cls(td, 'min-w-[200px]')}>
        <TextCell value={local.signingStatus} onChange={(v) => set('signingStatus', v)} onBlur={flush} placeholder="Signing / status notes" />
      </td>
      <td className={cls(td, 'w-[140px]')}>
        <TextCell value={local.approvalStatus} onChange={(v) => set('approvalStatus', v)} onBlur={flush} placeholder="Approved / N/A" />
      </td>
      <td className={cls(td, 'w-[110px]')}>
        <SelectCell
          value={local.fundedStatus}
          options={FUNDED_OPTIONS}
          onChange={(v) => set('fundedStatus', v as SaleTrackerRow['fundedStatus'])}
          onBlur={flush}
          colorMap={fundedColors}
        />
      </td>
      <td className={cls(td, 'w-[110px]')}>
        <input
          type="number"
          value={local.amountLeftToPay ?? ''}
          onChange={(e) => set('amountLeftToPay', e.target.value ? parseFloat(e.target.value) : null)}
          onBlur={flush}
          placeholder="—"
          className="h-full w-full bg-transparent px-2 py-1.5 text-right text-sm text-amber-700 font-semibold outline-none focus:bg-white focus:ring-1 focus:ring-inset focus:ring-[#1B3C6C] focus:rounded-sm"
        />
      </td>
      <td className={cls(td, 'min-w-[150px]')}>
        <TextCell value={local.notes} onChange={(v) => set('notes', v)} onBlur={flush} placeholder="Notes" />
      </td>
      <td className={cls(td, 'w-[80px] text-center')}>
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

// ── Mobile: edit bottom sheet ─────────────────────────────────────────────────

type EditSheetProps = {
  row: SaleTrackerRow;
  onSave: (id: string, updates: Partial<SaleTrackerRow>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
};

function EditSheet({ row, onSave, onDelete, onClose }: EditSheetProps) {
  const [local, setLocal] = useState<SaleTrackerRow>(row);

  const set = <K extends keyof SaleTrackerRow>(field: K, value: SaleTrackerRow[K]) =>
    setLocal((prev) => ({ ...prev, [field]: value }));

  const handleSave = () => {
    onSave(row.id, local);
    onClose();
  };

  const handleDelete = () => {
    if (!window.confirm('Delete this row?')) return;
    onDelete(row.id);
    onClose();
  };

  const fieldLabel = 'text-xs font-black uppercase tracking-[0.1em] text-slate-500 mb-1 block';
  const fieldInput = 'w-full rounded-[0.5rem] border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 focus:border-[#1B3C6C] focus:outline-none focus:ring-2 focus:ring-blue-100';
  const fieldSelect = 'w-full rounded-[0.5rem] border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 focus:border-[#1B3C6C] focus:outline-none focus:ring-2 focus:ring-blue-100';

  return (
    <div className="fixed inset-0 z-[95] flex flex-col justify-end bg-slate-950/50 backdrop-blur-sm lg:hidden">
      {/* Backdrop tap to close */}
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Close" />

      {/* Sheet */}
      <div
        className="relative flex max-h-[92dvh] flex-col overflow-hidden rounded-t-2xl bg-[#eef3f8] shadow-[0_-24px_60px_rgba(15,23,42,0.2)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="h-1 w-10 rounded-full bg-slate-300" />
        </div>

        {/* Sheet header */}
        <div className="flex items-center justify-between px-4 pb-3 pt-1 shrink-0">
          <div>
            <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-[#32639b]">Edit Entry</p>
            <h2 className="text-lg font-black text-slate-950 leading-tight">
              {row.clientName || 'New Row'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable fields */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
          {/* Client + Total side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={fieldLabel}>Client Name</label>
              <input className={fieldInput} value={local.clientName} onChange={(e) => set('clientName', e.target.value)} placeholder="Client name" />
            </div>
            <div>
              <label className={fieldLabel}>Project Total ($)</label>
              <input type="number" className={fieldInput} value={local.projectTotal || ''} onChange={(e) => set('projectTotal', parseFloat(e.target.value) || 0)} placeholder="0" />
            </div>
            <div>
              <label className={fieldLabel}>Left to Pay ($)</label>
              <input type="number" className={fieldInput} value={local.amountLeftToPay ?? ''} onChange={(e) => set('amountLeftToPay', e.target.value ? parseFloat(e.target.value) : null)} placeholder="—" />
            </div>
          </div>

          {/* Dropdowns */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={fieldLabel}>Payment Type</label>
              <select className={fieldSelect} value={local.paymentType} onChange={(e) => set('paymentType', e.target.value)}>
                {PAYMENT_OPTIONS.map((o) => <option key={o} value={o}>{o || '—'}</option>)}
              </select>
            </div>
            <div>
              <label className={fieldLabel}>Funded</label>
              <select className={fieldSelect} value={local.fundedStatus} onChange={(e) => set('fundedStatus', e.target.value as SaleTrackerRow['fundedStatus'])}>
                {FUNDED_OPTIONS.map((o) => <option key={o} value={o}>{o || '—'}</option>)}
              </select>
            </div>
          </div>

          {/* City + Start Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={fieldLabel}>City</label>
              <input className={fieldInput} value={local.city} onChange={(e) => set('city', e.target.value)} placeholder="City" />
            </div>
            <div>
              <label className={fieldLabel}>Start Date</label>
              <input className={fieldInput} value={local.startDate} onChange={(e) => set('startDate', e.target.value)} placeholder="e.g. April" />
            </div>
          </div>

          {/* Approval status */}
          <div>
            <label className={fieldLabel}>Approval Status</label>
            <input className={fieldInput} value={local.approvalStatus} onChange={(e) => set('approvalStatus', e.target.value)} placeholder="e.g. Approved 60,000" />
          </div>

          {/* Signing / status */}
          <div>
            <label className={fieldLabel}>Status / Signing Details</label>
            <textarea
              rows={3}
              className={cls(fieldInput, 'resize-none')}
              value={local.signingStatus}
              onChange={(e) => set('signingStatus', e.target.value)}
              placeholder="Signing status and notes…"
            />
          </div>

          {/* Notes */}
          <div>
            <label className={fieldLabel}>Notes</label>
            <textarea
              rows={2}
              className={cls(fieldInput, 'resize-none')}
              value={local.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Internal notes…"
            />
          </div>

          {/* On hold toggle */}
          <button
            type="button"
            onClick={() => set('onHold', !local.onHold)}
            className={cls(
              'w-full rounded-[0.5rem] border px-4 py-3 text-sm font-bold transition text-left flex items-center justify-between',
              local.onHold
                ? 'border-amber-300 bg-amber-50 text-amber-700'
                : 'border-slate-200 bg-white text-slate-600'
            )}
          >
            <span className="flex items-center gap-2">
              <Archive className="h-4 w-4" />
              {local.onHold ? 'On Hold — tap to remove' : 'Mark as On Hold'}
            </span>
            <span className={cls(
              'h-5 w-9 rounded-full transition-colors',
              local.onHold ? 'bg-amber-400' : 'bg-slate-200'
            )}>
              <span className={cls(
                'block h-5 w-5 rounded-full bg-white shadow transition-transform border border-slate-200',
                local.onHold ? 'translate-x-4' : 'translate-x-0'
              )} />
            </span>
          </button>
        </div>

        {/* Action buttons */}
        <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 flex gap-2">
          <button
            type="button"
            onClick={handleDelete}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.5rem] border border-red-200 bg-red-50 text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-[0.5rem] border border-slate-300 py-2.5 text-sm font-bold text-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 rounded-[0.5rem] bg-[#1B3C6C] py-2.5 text-sm font-bold text-white"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Mobile card ───────────────────────────────────────────────────────────────

function MobileCard({ row, onTap, onMoveUp, onMoveDown }: { row: SaleTrackerRow; onTap: () => void; onMoveUp?: () => void; onMoveDown?: () => void }) {
  const badge = row.fundedStatus ? fundedBadge[row.fundedStatus] : '';

  return (
    <button
      type="button"
      onClick={onTap}
      className={cls(
        'w-full rounded-xl border bg-white px-4 py-3.5 text-left shadow-sm transition active:scale-[0.99]',
        row.onHold ? 'border-amber-200 bg-amber-50/60' : 'border-slate-200'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[0.9rem] font-black text-slate-900 leading-tight truncate">
              {row.clientName || 'Unnamed'}
            </p>
            {row.onHold && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-wide text-amber-700">
                On Hold
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            {row.projectTotal > 0 && (
              <span className="text-sm font-black text-[#1B3C6C]">
                {formatCurrency(row.projectTotal)}
              </span>
            )}
            {row.city && (
              <span className="text-xs font-semibold text-slate-500">{row.city}</span>
            )}
            {row.paymentType && (
              <span className="text-xs font-semibold text-slate-400">{row.paymentType}</span>
            )}
          </div>
          {row.signingStatus && (
            <p className="mt-1.5 text-xs font-semibold text-slate-500 line-clamp-1">
              {row.signingStatus}
            </p>
          )}
          {row.notes && (
            <p className="mt-0.5 text-xs font-semibold text-slate-400 line-clamp-1 italic">
              {row.notes}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {badge && (
            <span className={cls('rounded-full px-2.5 py-0.5 text-[0.65rem] font-black uppercase tracking-wide', badge)}>
              {row.fundedStatus}
            </span>
          )}
          {row.amountLeftToPay != null && row.amountLeftToPay > 0 && (
            <span className="text-[0.7rem] font-bold text-amber-600">
              Owes {formatCurrency(row.amountLeftToPay)}
            </span>
          )}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onMoveUp?.(); }}
              disabled={!onMoveUp}
              className="p-1 text-slate-300 hover:text-[#1B3C6C] disabled:opacity-30 transition"
              aria-label="Move up"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onMoveDown?.(); }}
              disabled={!onMoveDown}
              className="p-1 text-slate-300 hover:text-[#1B3C6C] disabled:opacity-30 transition"
              aria-label="Move down"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PortalSalesTracker() {
  const { currentUser, isAdmin } = usePortalAuth();
  const { trackerRows, users, addTrackerRow, updateTrackerRow, deleteTrackerRow } = usePortalData();
  const [repFilter, setRepFilter] = useState<string>('all');
  const [showOnHold, setShowOnHold] = useState(false);
  const [editingRow, setEditingRow] = useState<SaleTrackerRow | null>(null);

  if (!currentUser) return null;

  const reps = users.filter((u) => u.role === 'rep' && u.active);

  const myRows = isAdmin
    ? trackerRows
    : trackerRows.filter((r) => r.repId === currentUser.id);

  const filteredRows = myRows
    .filter((r) => showOnHold ? r.onHold : !r.onHold)
    .filter((r) => repFilter === 'all' || r.repId === repFilter)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));

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

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= filteredRows.length) return;
    const a = filteredRows[index];
    const b = filteredRows[swapIndex];
    const aOrder = a.sortOrder || index;
    const bOrder = b.sortOrder || swapIndex;
    void updateTrackerRow(a.id, { sortOrder: bOrder });
    void updateTrackerRow(b.id, { sortOrder: aOrder });
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this row?')) return;
    void deleteTrackerRow(id);
  };

  const handleAddRow = async () => {
    const repId = isAdmin && repFilter !== 'all' ? repFilter : currentUser.id;
    const newRow = await addTrackerRow(repId);
    if (newRow) setEditingRow(newRow);
  };

  const getRepName = (repId: string) => users.find((u) => u.id === repId)?.name ?? repId;

  const thCls = 'px-2 py-2.5 text-left text-[0.63rem] font-black uppercase tracking-[0.1em] text-slate-400 border-r border-slate-200 last:border-r-0 whitespace-nowrap select-none bg-slate-50';

  // ── Shared header content ──────────────────────────────────────────────
  const headerControls = (
    <div className="flex flex-wrap items-center gap-2">
      {isAdmin && (
        <select
          value={repFilter}
          onChange={(e) => setRepFilter(e.target.value)}
          className="rounded-[0.5rem] border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 focus:border-[#1B3C6C] focus:outline-none"
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
  );

  // ── Stats ────────────────────────────────────────────────────────────
  const statsBar = !showOnHold && (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
  );

  return (
    <div className="flex flex-col gap-5 pb-10">
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
        {headerControls}
      </header>

      {statsBar}

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* DESKTOP: full-width scrollable table                            */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <div className="hidden lg:block rounded-[0.5rem] border border-white bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="border-b-2 border-slate-200">
              <tr>
                <th className="w-7 bg-slate-50 border-r border-slate-200" />
                {isAdmin && <th className={thCls}>Rep</th>}
                <th className={cls(thCls, 'min-w-[150px]')}>Client Name</th>
                <th className={cls(thCls, 'text-right min-w-[110px]')}>Project Total</th>
                <th className={cls(thCls, 'min-w-[130px]')}>Payment Type</th>
                <th className={cls(thCls, 'min-w-[90px]')}>City</th>
                <th className={cls(thCls, 'min-w-[85px]')}>Start Date</th>
                <th className={cls(thCls, 'min-w-[220px]')}>Status / Signing Details</th>
                <th className={cls(thCls, 'min-w-[130px]')}>Approval Status</th>
                <th className={cls(thCls, 'min-w-[100px]')}>Funded</th>
                <th className={cls(thCls, 'text-right min-w-[100px]')}>Left to Pay</th>
                <th className={cls(thCls, 'min-w-[150px]')}>Notes</th>
                <th className={cls(thCls, 'min-w-[75px]')}>Hold</th>
                <th className="w-8 bg-slate-50" />
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
                filteredRows.map((row, index) => (
                  <TrackerRow
                    key={row.id}
                    row={row}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    onMoveUp={index > 0 ? () => handleMove(index, 'up') : undefined}
                    onMoveDown={index < filteredRows.length - 1 ? () => handleMove(index, 'down') : undefined}
                    showRepName={isAdmin}
                    repName={getRepName(row.repId)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
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

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* MOBILE: card list                                               */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <div className="lg:hidden space-y-2.5">
        {filteredRows.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12">
            <p className="text-sm font-bold text-slate-400">
              {showOnHold ? 'No deals on hold.' : 'No rows yet.'}
            </p>
            {!showOnHold && (
              <button
                type="button"
                onClick={handleAddRow}
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#1B3C6C] px-4 py-2 text-xs font-black text-white shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                Add First Row
              </button>
            )}
          </div>
        ) : (
          filteredRows.map((row, index) => (
            <MobileCard
              key={row.id}
              row={row}
              onTap={() => setEditingRow(row)}
              onMoveUp={index > 0 ? () => handleMove(index, 'up') : undefined}
              onMoveDown={index < filteredRows.length - 1 ? () => handleMove(index, 'down') : undefined}
            />
          ))
        )}

        {/* Mobile add button at bottom of list */}
        {filteredRows.length > 0 && (
          <button
            type="button"
            onClick={handleAddRow}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-3.5 text-sm font-bold text-slate-500 transition hover:border-[#1B3C6C] hover:text-[#1B3C6C]"
          >
            <Plus className="h-4 w-4" />
            Add Row
          </button>
        )}
      </div>

      <p className="hidden lg:block text-xs font-semibold text-slate-400 text-center">
        Click any cell to edit · Changes save automatically · Tab between fields
      </p>

      {/* ── Mobile edit sheet ── */}
      {editingRow && (
        <EditSheet
          row={editingRow}
          onSave={(id, updates) => {
            handleSave(id, updates);
          }}
          onDelete={(id) => {
            void deleteTrackerRow(id);
          }}
          onClose={() => setEditingRow(null)}
        />
      )}
    </div>
  );
}
