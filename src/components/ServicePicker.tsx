import { Link } from 'react-router-dom';
import { ArrowRight, Bath, CookingPot, Layers, Trees, type LucideIcon } from 'lucide-react';
import { BOOKING_SERVICES } from '../lib/bookingRoutes';
import { cn } from '../lib/utils';

/**
 * "What are you planning?" — one tap from a general page to the calendar for
 * that service.
 *
 * The homepage's buttons used to open /match, the general project-review
 * form, on the reasoning that a homepage visitor has not picked a service yet.
 * Measured Oct 2026 (see src/lib/bookingRoutes.ts), /match turned 13 of 131
 * submissions into a booking while the /consultation/<service> flows booked
 * about 120 of 140. Asking "which project?" on the button itself gets the
 * visitor to the flow that converts without guessing for them.
 *
 * /match is not retired: "Not sure yet?" still goes there.
 */
const ICONS: Record<(typeof BOOKING_SERVICES)[number]['slug'], LucideIcon> = {
  basement: Layers,
  kitchen: CookingPot,
  bathroom: Bath,
  'garden-suite': Trees,
};

type ServicePickerProps = {
  /** 'dark' sits on a photo or a dark band; 'light' on a white page. */
  tone?: 'dark' | 'light';
  /**
   * One row of pills from `sm` up, instead of a 2×2 grid.
   *
   * For the hero, which is one screen tall with the copy laid over the photo:
   * the grid made the copy ~110px taller than the button it replaced, enough
   * to run into the Unfinished / Finished labels on a 768px-tall laptop.
   * Phones keep the grid — the hero copy sits at the bottom there, with room.
   */
  compact?: boolean;
  /** Where the picker is, for the analytics hook. */
  source: string;
  className?: string;
};

export default function ServicePicker({
  tone = 'dark',
  compact = false,
  source,
  className,
}: ServicePickerProps) {
  const dark = tone === 'dark';

  return (
    <div className={className}>
      <p
        className={cn(
          'text-sm font-semibold',
          dark ? 'text-white/85' : 'text-slate-700',
          compact && 'sm:sr-only'
        )}
      >
        What are you planning?
      </p>

      {/* data-booking-zone is on the tiles, not the whole picker:
          MobileBookingBar stands down only while a tile is actually on
          screen, not while just the question above them is. */}
      <div
        data-booking-zone
        className={cn(
          'mt-3 grid grid-cols-2 gap-2.5',
          compact ? 'sm:mt-0 sm:flex sm:flex-wrap sm:gap-2' : 'sm:gap-3'
        )}
      >
        {BOOKING_SERVICES.map(({ slug, label }) => {
          const Icon = ICONS[slug];
          return (
            <Link
              key={slug}
              to={`/consultation/${slug}`}
              data-analytics={`service-picker-${source}-${slug}`}
              className={cn(
                'group flex min-h-[3rem] items-center gap-2.5 rounded-xl px-3.5 py-2 text-[0.92rem] font-bold leading-tight tracking-[-0.015em] transition focus-visible:outline-none focus-visible:ring-4',
                compact ? 'sm:px-4' : 'sm:min-h-[3.25rem] sm:py-2.5 sm:text-base',
                dark
                  ? 'bg-white text-[#14100C] shadow-[0_12px_30px_rgba(0,0,0,0.3)] hover:bg-white/90 focus-visible:ring-white/40'
                  : 'border border-slate-200 bg-white text-slate-900 shadow-sm hover:border-[#1B3C6C] hover:text-[#1B3C6C] focus-visible:ring-blue-100'
              )}
            >
              <Icon
                className={cn('h-5 w-5 shrink-0 text-[#1B3C6C]', compact && 'sm:hidden')}
                aria-hidden="true"
              />
              <span className="min-w-0">{label}</span>
              {!compact && (
                <ArrowRight
                  className="ml-auto hidden h-4 w-4 shrink-0 opacity-40 transition group-hover:translate-x-0.5 group-hover:opacity-100 sm:block"
                  aria-hidden="true"
                />
              )}
            </Link>
          );
        })}
      </div>

      <p className={cn('text-sm', dark ? 'text-white/75' : 'text-slate-500', compact ? 'mt-3' : 'mt-4')}>
        Not sure yet?{' '}
        <Link
          to="/match"
          className={cn(
            'font-semibold underline underline-offset-4',
            dark ? 'text-white decoration-white/50 hover:decoration-white' : 'text-[#1B3C6C]'
          )}
        >
          Start a free project review
        </Link>
      </p>
    </div>
  );
}
