import { RotateCcw, Trash2, X } from 'lucide-react';

export type TrashItem = { id: string };

type Props<T extends TrashItem> = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  emptyLabel: string;
  items: T[];
  loading: boolean;
  primary: (item: T) => string;
  secondary: (item: T) => string;
  onRestore: (item: T) => void;
  onPurge: (item: T) => void;
};

export default function TrashPanel<T extends TrashItem>({
  open,
  onClose,
  title,
  subtitle,
  emptyLabel,
  items,
  loading,
  primary,
  secondary,
  onRestore,
  onPurge,
}: Props<T>) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[105] bg-slate-950/45 p-0 backdrop-blur-sm sm:p-5">
      <div className="ml-auto flex h-full w-full max-w-lg flex-col overflow-hidden bg-white shadow-[0_24px_80px_rgba(15,23,42,0.25)] sm:rounded-[0.5rem]">
        <div
          className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 pb-5"
          style={{ paddingTop: 'max(1.25rem, calc(1.25rem + env(safe-area-inset-top, 0px)))' }}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#32639b]">Recently Deleted</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.02em]">{title}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
            aria-label="Close trash"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <p className="text-sm font-semibold text-slate-400">Loading…</p>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Trash2 className="h-6 w-6" />
              </span>
              <p className="mt-3 text-sm font-bold text-slate-600">Trash is empty</p>
              <p className="mt-1 text-xs font-medium text-slate-400">{emptyLabel}</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-[0.5rem] border border-slate-200 bg-[#fbfdff] p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-900">{primary(item)}</p>
                    <p className="truncate text-xs font-semibold text-slate-500">{secondary(item)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onRestore(item)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#1B3C6C] px-3 py-1.5 text-xs font-black text-white transition hover:bg-[#153158]"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Restore
                    </button>
                    <button
                      type="button"
                      onClick={() => onPurge(item)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      title="Delete permanently"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
