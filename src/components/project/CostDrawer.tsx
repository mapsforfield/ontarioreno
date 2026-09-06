import { useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { CostTab } from '../../data/projects/costContent';

/**
 * Everything the old page kept in four stacked full-width sections, one tap away.
 *
 * The cost table, the drivers, the quote warning and the permits are not
 * decoration and they are not being retired — they pre-qualify a reader and
 * they carry the organic search this page ranks on. But they are ANSWERS TO
 * QUESTIONS, and a page that pre-empts every question a visitor might have is
 * the page that took twelve screens to scroll and buried its pricing at the
 * bottom.
 *
 * So the content stays, in full, in the DOM — crawlers read it either way —
 * and the reader opens it when they want it. On desktop it is a side panel; on
 * a phone it is a bottom sheet. Both are the same component.
 *
 * A real dialog: Escape closes it, the scrim closes it, focus moves in on open
 * and returns to the control that opened it, and the page behind cannot
 * scroll. Same standard as ProjectGallery's lightbox — a panel that traps a
 * keyboard user is worse than no panel.
 */

/**
 * Tabs are supplied by the caller so one drawer serves every room. The content
 * itself lives in src/data/projects/costContent.tsx — it is moved copy from the
 * old cost guides, not new copy, and the note at the top of that file explains
 * why it must not drift.
 */

export function CostDrawer({
  open,
  onClose,
  openerRef,
  tabs,
}: {
  open: boolean;
  onClose: () => void;
  /** Focus goes back here on close, so a keyboard user does not lose their place. */
  openerRef?: React.RefObject<HTMLElement | null>;
  tabs: CostTab[];
}) {
  const [tabKey, setTabKey] = useState(tabs[0].key);
  const tab = tabs.find((t) => t.key === tabKey) ?? tabs[0];
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      openerRef?.current?.focus();
    };
  }, [open, onClose, openerRef]);

  return (
    <>
      {/* The scrim is always mounted so the panel can animate out rather than
          vanishing. `inert` when closed keeps it off the tab order. */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-[60] bg-slate-900/45 transition-opacity duration-200 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        // Bottom sheet on a phone, side panel from lg up. Same content.
        className={`fixed z-[70] flex flex-col bg-white shadow-md outline-none transition-transform duration-300 ease-out
          inset-x-0 bottom-0 h-[86vh] rounded-t-[1.35rem]
          lg:inset-y-0 lg:left-auto lg:right-0 lg:h-full lg:w-[32rem] lg:rounded-none
          ${open ? 'translate-y-0 lg:translate-x-0' : 'translate-y-full lg:translate-y-0 lg:translate-x-full'}`}
      >
        <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4">
          <h3 id={titleId} className="text-lg font-bold text-slate-900">
            {tab.label}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto px-5 pt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTabKey(t.key)}
              aria-pressed={t.key === tab.key}
              className={`whitespace-nowrap rounded-[0.95rem] border px-4 py-2 text-sm font-bold transition ${
                t.key === tab.key
                  ? 'border-[#1B3C6C] bg-[#1B3C6C] text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-12 pt-5">{tab.body}</div>
      </div>
    </>
  );
}
