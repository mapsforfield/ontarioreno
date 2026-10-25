import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { SERVICE_PICKER_HREF } from '../lib/bookingRoutes';
import { cn } from '../lib/utils';

/**
 * Phone-only booking bar.
 *
 * The homepage runs to about fifteen phone screens, and for most of them no
 * booking button was on screen. This keeps one there — except while anything
 * marked `data-booking-zone` (the service picker's tiles) or the footer is in
 * view, so it never sits on top of its own duplicate.
 *
 * Hidden until the observer reports, so the prerendered HTML and the first
 * paint never show it over the hero.
 */
export default function MobileBookingBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const zones = document.querySelectorAll('[data-booking-zone], footer');
    const inView = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) inView.add(entry.target);
        else inView.delete(entry.target);
      }
      setVisible(inView.size === 0);
    });
    zones.forEach((zone) => observer.observe(zone));
    return () => observer.disconnect();
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 pt-3 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur transition-transform duration-300 md:hidden',
        visible ? 'translate-y-0' : 'pointer-events-none translate-y-full'
      )}
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <Link
        to={SERVICE_PICKER_HREF}
        tabIndex={visible ? undefined : -1}
        data-analytics="mobile-booking-bar"
        className="flex min-h-[3rem] w-full items-center justify-center gap-2 rounded-xl bg-[#1B3C6C] text-base font-bold text-white shadow-[0_10px_22px_rgba(27,60,108,0.26)] transition hover:bg-[#153158]"
      >
        Book a free consultation
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
