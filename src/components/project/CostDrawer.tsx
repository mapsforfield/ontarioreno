import { useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';

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

type TabKey = 'cost' | 'drivers' | 'quotes' | 'permits';

const COST_ROWS: [string, string][] = [
  ['Demolition & prep', '$1,500 – $4,000'],
  ['Waterproofing & shower prep', '$2,500 – $6,000'],
  ['Tile supply & installation', '$5,000 – $14,000+'],
  ['Vanity & countertop', '$2,500 – $7,000+'],
  ['Toilet, tub, shower fixtures', '$2,500 – $8,000+'],
  ['Plumbing changes', '$2,500 – $8,000'],
  ['Electrical & lighting', '$1,500 – $5,000'],
  ['Glass / shower enclosure', '$1,500 – $5,000+'],
  ['Painting & finishing', '$1,500 – $4,000'],
];

const TAB_LABELS: Record<TabKey, string> = {
  cost: 'What it costs',
  drivers: 'What drives it',
  quotes: 'Why quotes differ',
  permits: 'Permits',
};

const TAB_ORDER: TabKey[] = ['cost', 'drivers', 'quotes', 'permits'];

function Body({ tab }: { tab: TabKey }) {
  if (tab === 'cost') {
    return (
      <>
        <h4 className="text-base font-bold text-slate-900">Bathrooms in Ontario</h4>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          Bathroom renovations usually range from <strong>$15,000 to $40,000+</strong>,
          with many projects falling between <strong>$20,000 and $30,000</strong>.
          Where yours lands is settled in the home, with the room measured.
        </p>
        <dl className="mt-5 border-t border-slate-200/80">
          {COST_ROWS.map(([label, range]) => (
            <div
              key={label}
              className="flex items-baseline justify-between gap-4 border-b border-slate-200/80 py-3"
            >
              <dt className="text-sm text-slate-700">{label}</dt>
              <dd className="whitespace-nowrap text-sm font-semibold tabular-nums text-slate-900">
                {range}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-5 text-sm leading-7 text-slate-500">
          Bathrooms become expensive quickly when premium tile, custom glass,
          layout changes, plumbing relocation, in-floor heating, or waterproofing
          remediation are part of the job.
        </p>
      </>
    );
  }

  if (tab === 'drivers') {
    return (
      <>
        <h4 className="text-base font-bold text-slate-900">
          Why two similar bathrooms price apart
        </h4>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          In most cases the biggest differences come from tile selection,
          waterproofing scope, fixture quality, and whether plumbing or layout
          changes are needed.
        </p>
        <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
          <li>Tile size, type, and installation complexity</li>
          <li>Custom shower builds and waterproofing</li>
          <li>Vanity, countertop, and fixture upgrades</li>
          <li>Plumbing relocation</li>
          <li>Glass enclosures and premium hardware</li>
        </ul>
        <h4 className="mt-7 text-base font-bold text-slate-900">Found after demo</h4>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
          <li>Rot, mold, or subfloor repair discovered after demo</li>
          <li>Electrical corrections and added lighting</li>
          <li>In-floor heating systems</li>
          <li>Niche details, benches, and custom trim</li>
          <li>Permit and design complexity</li>
        </ul>
      </>
    );
  }

  if (tab === 'quotes') {
    return (
      <>
        <h4 className="text-base font-bold text-slate-900">
          Why bathroom quotes can be misleading
        </h4>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          Some quotes look attractive because they exclude waterproofing details,
          fixture allowances, glass, tile prep, hidden plumbing work, waste
          removal, or finish-level assumptions. Bathrooms are one of the easiest
          places for &quot;extras&quot; to show up if the quote is not detailed.
        </p>
        <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900">
          Lower quotes often understate the expensive hidden work. That is why
          many &quot;budget&quot; bathrooms become far more expensive once
          construction begins.
        </p>
      </>
    );
  }

  return (
    <>
      <h4 className="text-base font-bold text-slate-900">Do you need a permit?</h4>
      <p className="mt-2 text-sm leading-7 text-slate-600">
        Sometimes. A straightforward refresh that keeps the same layout may not.
        Once plumbing is relocated, electrical is modified, ventilation changes,
        or structural work is involved, permits and code compliance become much
        more likely.
      </p>
      <h4 className="mt-6 text-base font-bold text-slate-900">
        More likely needed for
      </h4>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
        <li>Moving drains or plumbing lines</li>
        <li>New electrical circuits or wiring changes</li>
        <li>Ventilation / exhaust changes</li>
        <li>Structural framing modifications</li>
        <li>Adding a brand new bathroom where one did not exist</li>
      </ul>
      <h4 className="mt-7 text-base font-bold text-slate-900">Why it matters</h4>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
        <li>Protects waterproofing and code compliance</li>
        <li>Helps avoid hidden failures behind finished tile</li>
        <li>Important for resale and renovation documentation</li>
        <li>Prevents shortcuts on plumbing and ventilation work</li>
      </ul>
    </>
  );
}

export function CostDrawer({
  open,
  onClose,
  openerRef,
}: {
  open: boolean;
  onClose: () => void;
  /** Focus goes back here on close, so a keyboard user does not lose their place. */
  openerRef?: React.RefObject<HTMLElement | null>;
}) {
  const [tab, setTab] = useState<TabKey>('cost');
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
            {TAB_LABELS[tab]}
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
          {TAB_ORDER.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              aria-pressed={tab === key}
              className={`whitespace-nowrap rounded-[0.95rem] border px-4 py-2 text-sm font-bold transition ${
                tab === key
                  ? 'border-[#1B3C6C] bg-[#1B3C6C] text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {TAB_LABELS[key]}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-12 pt-5">
          <Body tab={tab} />
        </div>
      </div>
    </>
  );
}
