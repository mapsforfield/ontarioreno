/**
 * Line drawings of each window type for /windows.
 *
 * Inline SVG rather than images: six pictures for the cost of a few hundred
 * bytes, crisp at any size, and nothing to lazy-load. The dashed "V" on an
 * opening sash is the drafting convention for which side it hinges on (the
 * point of the V is the hinge), so the drawings read correctly to anyone who
 * has seen a window schedule.
 */
type IconProps = { className?: string };

const frame = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.5, strokeLinejoin: 'round' as const };
const sash = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeDasharray: '4 3', strokeLinecap: 'round' as const };
const glass = { fill: 'currentColor', opacity: 0.08 };

export function FixedCasementIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 96 64" className={className} aria-hidden="true">
      <rect x="4" y="4" width="88" height="56" rx="2" {...glass} />
      <rect x="4" y="4" width="88" height="56" rx="2" {...frame} />
      <line x1="62" y1="4" x2="62" y2="60" {...frame} />
      {/* Casement on the right, hinged on its outer edge */}
      <polyline points="62,6 90,32 62,58" {...sash} />
    </svg>
  );
}

export function CasementIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 96 64" className={className} aria-hidden="true">
      <rect x="30" y="4" width="36" height="56" rx="2" {...glass} />
      <rect x="30" y="4" width="36" height="56" rx="2" {...frame} />
      <polyline points="32,6 64,32 32,58" {...sash} />
    </svg>
  );
}

export function BayBowIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 96 64" className={className} aria-hidden="true">
      {/* Three units: two angled flankers and a wide centre, seen from above-front */}
      <polygon points="6,10 26,4 26,60 6,54" {...glass} />
      <polygon points="6,10 26,4 26,60 6,54" {...frame} />
      <rect x="26" y="4" width="44" height="56" {...glass} />
      <rect x="26" y="4" width="44" height="56" {...frame} />
      <polygon points="70,4 90,10 90,54 70,60" {...glass} />
      <polygon points="70,4 90,10 90,54 70,60" {...frame} />
    </svg>
  );
}

export function ShapesIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 96 64" className={className} aria-hidden="true">
      {/* Octagon */}
      <polygon points="17,6 31,6 41,16 41,30 31,40 17,40 7,30 7,16" {...glass} />
      <polygon points="17,6 31,6 41,16 41,30 31,40 17,40 7,30 7,16" {...frame} />
      {/* Sloped transom over a casement */}
      <polygon points="52,22 90,6 90,26 52,26" {...glass} />
      <polygon points="52,22 90,6 90,26 52,26" {...frame} />
      <rect x="52" y="26" width="38" height="34" {...glass} />
      <rect x="52" y="26" width="38" height="34" {...frame} />
      <polyline points="54,28 88,43 54,58" {...sash} />
    </svg>
  );
}

export function AwningIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 96 64" className={className} aria-hidden="true">
      <rect x="14" y="12" width="68" height="40" rx="2" {...glass} />
      <rect x="14" y="12" width="68" height="40" rx="2" {...frame} />
      {/* Hinged at the top, opens out from the bottom */}
      <polyline points="16,50 48,14 80,50" {...sash} />
    </svg>
  );
}

export function SliderIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 96 64" className={className} aria-hidden="true">
      <rect x="10" y="12" width="76" height="40" rx="2" {...glass} />
      <rect x="10" y="12" width="76" height="40" rx="2" {...frame} />
      <line x1="48" y1="12" x2="48" y2="52" {...frame} />
      {/* Slides sideways */}
      <path d="M22 32 H38 M33 27 L38 32 L33 37" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function EntryDoorIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 96 64" className={className} aria-hidden="true">
      {/* Door with two sidelites */}
      <rect x="22" y="4" width="10" height="56" {...glass} />
      <rect x="22" y="4" width="10" height="56" {...frame} />
      <rect x="32" y="4" width="32" height="56" {...frame} />
      <rect x="40" y="10" width="16" height="18" rx="1" {...glass} />
      <rect x="40" y="10" width="16" height="18" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="58" cy="36" r="1.8" fill="currentColor" />
      <rect x="64" y="4" width="10" height="56" {...glass} />
      <rect x="64" y="4" width="10" height="56" {...frame} />
    </svg>
  );
}

export function PatioDoorIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 96 64" className={className} aria-hidden="true">
      <rect x="16" y="4" width="64" height="56" rx="1" {...glass} />
      <rect x="16" y="4" width="64" height="56" rx="1" {...frame} />
      <line x1="48" y1="4" x2="48" y2="60" {...frame} />
      <path d="M56 32 H72 M67 27 L72 32 L67 37" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * A casement-and-fixed unit in the chosen exterior colour, for the colour
 * picker. Interior is always white, so only the frame changes.
 */
export function ColourPreview({ exterior, className }: { exterior: string; className?: string }) {
  return (
    <svg viewBox="0 0 160 110" className={className} role="img" aria-label="Window preview in the selected exterior colour">
      <rect x="0" y="0" width="160" height="110" rx="10" fill="#e9e4dc" />
      {/* Brick hint */}
      <g stroke="#d6cdc0" strokeWidth="1">
        {[18, 36, 54, 72, 90].map((y) => (
          <line key={y} x1="0" y1={y} x2="160" y2={y} />
        ))}
      </g>
      <rect x="22" y="14" width="116" height="82" rx="2" fill={exterior} />
      <rect x="30" y="22" width="66" height="66" fill="#cfe0ee" />
      <rect x="104" y="22" width="26" height="66" fill="#cfe0ee" />
      <polyline points="105,24 129,55 105,86" fill="none" stroke={exterior} strokeWidth="1.5" strokeDasharray="4 3" />
    </svg>
  );
}
