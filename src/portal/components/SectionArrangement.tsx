// Drag-to-rearrange for a page's desktop sections, saved per user.
//
// The page keeps rendering its sections exactly where they are in the JSX —
// nothing is moved, wrapped in render props or re-mounted. They sit in one
// flex column, and each gets a CSS `order` from the user's saved arrangement.
// So a section's state (an open dropdown, a scrolled list) survives a drag,
// and a page opting in is a handful of props, not a rewrite.
//
// Order logic and the "a saved layout can never hide a section" guarantee
// live in lib/section-layout.ts. While an admin is viewing as a rep the grips
// are not drawn at all: the view is read-only, and the server refuses the
// write anyway.

import { useMemo, useState, type DragEvent, type KeyboardEvent, type ReactNode } from 'react';
import { GripHorizontal } from 'lucide-react';
import { usePortalAuth } from '../auth';
import { usePortalData } from '../data/store';
import { applySectionOrder, moveSection } from '../../../lib/section-layout';

type Place = 'before' | 'after';

export function useSectionArrangement(page: string, defaults: readonly string[]) {
  const { sectionLayouts, setSectionOrder } = usePortalData();
  const { viewingAsRepId } = usePortalAuth();
  const canArrange = !viewingAsRepId;
  const saved = sectionLayouts[page];
  const order = useMemo(() => applySectionOrder(defaults, saved), [defaults, saved]);
  const [dragging, setDragging] = useState<string | null>(null);
  const [hint, setHint] = useState<{ id: string; place: Place } | null>(null);

  const reset = () => {
    setDragging(null);
    setHint(null);
  };

  const commit = (next: string[]) => {
    if (next.join() !== order.join()) void setSectionOrder(page, next);
  };

  /** Spread onto the section element. It must also carry `relative`. */
  const sectionProps = (id: string) => ({
    'data-section-id': id,
    style: { order: order.indexOf(id) },
    onDragOver: (e: DragEvent<HTMLElement>) => {
      if (!dragging) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const rect = e.currentTarget.getBoundingClientRect();
      const place: Place = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
      if (hint?.id !== id || hint.place !== place) setHint({ id, place });
    },
    onDrop: (e: DragEvent<HTMLElement>) => {
      if (!dragging) return;
      e.preventDefault();
      if (hint) commit(moveSection(order, dragging, hint.id, hint.place));
      reset();
    },
  });

  /** The drag handle and drop line for one section. Render inside it. */
  const handle = (id: string, label: string): ReactNode => {
    const showLine = dragging && dragging !== id && hint?.id === id;
    return (
      <>
        {canArrange && (
          <button
            type="button"
            draggable
            onDragStart={(e) => {
              setDragging(id);
              e.dataTransfer.effectAllowed = 'move';
              e.dataTransfer.setData('text/plain', id);
              const section = e.currentTarget.closest('[data-section-id]');
              if (section instanceof HTMLElement) e.dataTransfer.setDragImage(section, 40, 16);
            }}
            onDragEnd={reset}
            onKeyDown={(e: KeyboardEvent<HTMLButtonElement>) => {
              const i = order.indexOf(id);
              if (e.key === 'ArrowUp' && i > 0) {
                e.preventDefault();
                commit(moveSection(order, id, order[i - 1], 'before'));
              } else if (e.key === 'ArrowDown' && i < order.length - 1) {
                e.preventDefault();
                commit(moveSection(order, id, order[i + 1], 'after'));
              }
            }}
            title={`Drag to move ${label} — only your view changes`}
            aria-label={`Move ${label}. Drag, or use the arrow keys.`}
            className="absolute left-1/2 top-0 z-10 flex h-4 w-12 -translate-x-1/2 cursor-grab items-center justify-center rounded-b-md text-slate-300 opacity-60 transition hover:bg-slate-100 hover:text-slate-600 hover:opacity-100 focus-visible:opacity-100 active:cursor-grabbing group-hover/section:opacity-100"
          >
            <GripHorizontal className="h-4 w-4" />
          </button>
        )}
        {showLine && (
          <div
            aria-hidden
            className={`pointer-events-none absolute inset-x-0 z-10 h-1 rounded-full bg-[#1B3C6C] ${
              hint.place === 'before' ? '-top-3' : '-bottom-3'
            }`}
          />
        )}
      </>
    );
  };

  /** Faded while it is the one being carried. */
  const isDragging = (id: string) => dragging === id;

  const resetLink: ReactNode =
    canArrange && saved ? (
      <div style={{ order: order.length + 1 }} className="flex justify-end">
        <button
          type="button"
          onClick={() => void setSectionOrder(page, [])}
          className="text-xs font-bold text-slate-400 transition hover:text-[#1B3C6C]"
        >
          Reset section order
        </button>
      </div>
    ) : null;

  return { order, sectionProps, handle, isDragging, resetLink };
}
