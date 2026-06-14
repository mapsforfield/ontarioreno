import { CheckCircle2, Undo2, X, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';
import { dismissToast, subscribeToasts, type ToastItem } from '../lib/toast';

export default function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  useEffect(() => subscribeToasts(setToasts), []);

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-[200] flex flex-col items-center gap-2 px-3"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 5.25rem)' }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-[0.75rem] border bg-white px-4 py-3 shadow-[0_16px_44px_rgba(15,23,42,0.22)]',
            'animate-[toastIn_180ms_ease-out]',
            t.variant === 'success'
              ? 'border-emerald-200'
              : t.variant === 'error'
                ? 'border-red-200'
                : 'border-slate-200'
          )}
        >
          {t.variant === 'success' ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          ) : t.variant === 'error' ? (
            <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900">{t.message}</p>
            {t.description && (
              <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">{t.description}</p>
            )}
          </div>
          {t.action && (
            <button
              type="button"
              onClick={() => {
                t.action!.onClick();
                dismissToast(t.id);
              }}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#1B3C6C] px-3 py-1.5 text-xs font-black text-white transition hover:bg-[#153158]"
            >
              <Undo2 className="h-3.5 w-3.5" />
              {t.action.label}
            </button>
          )}
          <button
            type="button"
            onClick={() => dismissToast(t.id)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
