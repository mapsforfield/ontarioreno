// Lightweight toast system — a tiny module-level pub/sub consumed by <Toaster/>.
// Used for the Undo-after-delete flow and general feedback.

export type ToastAction = { label: string; onClick: () => void };

export type ToastItem = {
  id: string;
  message: string;
  description?: string;
  action?: ToastAction;
  variant?: 'default' | 'success' | 'error';
  /** ms before auto-dismiss; 0 keeps it until dismissed. Default 5000. */
  duration?: number;
};

type Listener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l(toasts);
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  listener(toasts);
  return () => {
    listeners.delete(listener);
  };
}

export function dismissToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function showToast(toast: Omit<ToastItem, 'id'>): string {
  const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const item: ToastItem = { duration: 5000, variant: 'default', ...toast, id };
  toasts = [item, ...toasts].slice(0, 4);
  emit();
  if (item.duration && item.duration > 0) {
    setTimeout(() => dismissToast(id), item.duration);
  }
  return id;
}
