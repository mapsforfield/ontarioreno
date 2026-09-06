import type { ReactNode } from 'react';

/**
 * The cost content that lives behind the "What it costs" drawer, per room.
 *
 * THIS IS MOVED COPY, NOT NEW COPY. Every figure and every line below was
 * already published on the live cost guide for that room. The redesign
 * relocated it out of four stacked full-width sections and into a drawer; it
 * did not rewrite it, and it must not start drifting from what the office has
 * approved. If a number here is wrong, it is wrong on the old page too —
 * change both, or neither.
 *
 * It stays rendered in the DOM rather than fetched on open, because these are
 * organic landing pages and this is the text they rank on.
 */

export type CostTab = {
  key: string;
  label: string;
  body: ReactNode;
};

function CostTable({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="mt-5 border-t border-slate-200/80">
      {rows.map(([label, range]) => (
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
  );
}

function Warning({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900">
      {children}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Bathroom — as published on the previous /bathroom-renovations page. */
/* ------------------------------------------------------------------ */

const BATHROOM_ROWS: [string, string][] = [
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

export const BATHROOM_COST_TABS: CostTab[] = [
  {
    key: 'cost',
    label: 'What it costs',
    body: (
      <>
        <h4 className="text-base font-bold text-slate-900">Bathrooms in Ontario</h4>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          Bathroom renovations usually range from <strong>$15,000 to $40,000+</strong>,
          with many projects falling between <strong>$20,000 and $30,000</strong>.
          Where yours lands is settled in the home, with the room measured.
        </p>
        <CostTable rows={BATHROOM_ROWS} />
        <p className="mt-5 text-sm leading-7 text-slate-500">
          Bathrooms become expensive quickly when premium tile, custom glass,
          layout changes, plumbing relocation, in-floor heating, or waterproofing
          remediation are part of the job.
        </p>
      </>
    ),
  },
  {
    key: 'drivers',
    label: 'What drives it',
    body: (
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
    ),
  },
  {
    key: 'quotes',
    label: 'Why quotes differ',
    body: (
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
        <Warning>
          Lower quotes often understate the expensive hidden work. That is why
          many &quot;budget&quot; bathrooms become far more expensive once
          construction begins.
        </Warning>
      </>
    ),
  },
  {
    key: 'permits',
    label: 'Permits',
    body: (
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
    ),
  },
];

/* ---------------------------------------------------------------- */
/* Kitchen — as published on the previous /kitchen-renovations page. */
/* ---------------------------------------------------------------- */

const KITCHEN_ROWS: [string, string][] = [
  ['Cabinetry', '$10,000 – $25,000+'],
  ['Countertops', '$3,500 – $10,000+'],
  ['Backsplash', '$1,500 – $4,500'],
  ['Flooring', '$3,000 – $8,000'],
  ['Electrical', '$3,000 – $8,000'],
  ['Plumbing', '$2,500 – $8,000'],
  ['Demolition & prep', '$2,000 – $5,000'],
  ['Painting & finishing', '$2,000 – $5,000'],
  ['Appliances', '$4,000 – $15,000+'],
];

export const KITCHEN_COST_TABS: CostTab[] = [
  {
    key: 'cost',
    label: 'What it costs',
    body: (
      <>
        <h4 className="text-base font-bold text-slate-900">Kitchens in Ontario</h4>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          Kitchen renovations usually range from <strong>$30,000 to $70,000+</strong>,
          with many projects falling between <strong>$35,000 and $55,000</strong>.
          Where yours lands is settled in the home, with the room measured.
        </p>
        <CostTable rows={KITCHEN_ROWS} />
        <p className="mt-5 text-sm leading-7 text-slate-500">
          Kitchens move up in price quickly when the layout changes, the panel
          needs upgrading, plumbing is relocated, or the project includes premium
          cabinetry, quartz or stone surfaces, built-in appliances, or custom
          millwork details.
        </p>
      </>
    ),
  },
  {
    key: 'drivers',
    label: 'What drives it',
    body: (
      <>
        <h4 className="text-base font-bold text-slate-900">
          Why two similar kitchens price apart
        </h4>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          Two kitchens can look similar in photos and still be tens of thousands
          apart in price. The biggest differences come from materials, layout
          complexity, and how much hidden work is needed behind the walls.
        </p>
        <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
          <li>Cabinet material and construction quality</li>
          <li>Quartz, granite, or premium countertop choices</li>
          <li>Moving sink, dishwasher, or gas lines</li>
          <li>Electrical rewiring or panel upgrades</li>
          <li>Built-in appliances and custom trim work</li>
        </ul>
        <h4 className="mt-7 text-base font-bold text-slate-900">Scope-related drivers</h4>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
          <li>Removing walls or changing the footprint</li>
          <li>Leveling floors or correcting framing issues</li>
          <li>New lighting plan and added circuits</li>
          <li>Venting changes for range hoods</li>
          <li>Permit and design complexity</li>
        </ul>
      </>
    ),
  },
  {
    key: 'quotes',
    label: 'Why quotes differ',
    body: (
      <>
        <h4 className="text-base font-bold text-slate-900">
          Why kitchen quotes vary so much
        </h4>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          Some quotes look cheaper because they leave out major pieces of the
          project: appliance supply, backsplash, demo, finish work, permit
          drawings, waste removal, electrical upgrades, or even installation
          details tied to cabinetry and countertops.
        </p>
        <Warning>
          A kitchen quote that does not name the cabinetry, the counter material
          and who supplies the appliances is not a price — it is an opening
          position.
        </Warning>
      </>
    ),
  },
  {
    key: 'permits',
    label: 'Permits',
    body: (
      <>
        <h4 className="text-base font-bold text-slate-900">Do you need a permit?</h4>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          Sometimes yes, sometimes no. A simple cabinet-and-finish refresh may not
          need one. Once walls move, plumbing is relocated, or circuits are added,
          it usually does.
        </p>
        <h4 className="mt-6 text-base font-bold text-slate-900">
          More likely needed for
        </h4>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
          <li>Removing or modifying walls</li>
          <li>Moving sink or major plumbing lines</li>
          <li>Adding new electrical circuits</li>
          <li>Structural or beam changes</li>
          <li>Range hood venting changes</li>
        </ul>
      </>
    ),
  },
];
