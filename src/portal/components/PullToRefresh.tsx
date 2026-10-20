import { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';

const TRIGGER = 72;
const MAX = 110;

/**
 * Pull down from the top of any portal page to reload its data — the gesture
 * every phone app has. Launched from the home screen there is no browser
 * reload button at all, so until now the only way to see a colleague's new
 * booking was to close and reopen the app.
 *
 * Phones only (under the lg breakpoint), only when the page is scrolled to the
 * very top, and never from inside a sheet, dialog or other fixed overlay — a
 * rep scrolling up in the outcome sheet must not reload the page under it.
 */
export default function PullToRefresh({ onRefresh }: { onRefresh: () => void }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const pullRef = useRef(0);

  useEffect(() => {
    const isPhone = () => window.matchMedia('(max-width: 1023px)').matches;

    const onStart = (e: TouchEvent) => {
      if (!isPhone() || window.scrollY > 0 || refreshing) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('[role="dialog"], .fixed, [data-no-ptr], input, textarea, select')) return;
      startY.current = e.touches[0].clientY;
    };
    const onMove = (e: TouchEvent) => {
      if (startY.current === null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0 || window.scrollY > 0) {
        pullRef.current = 0;
        setPull(0);
        return;
      }
      // Resistance, like iOS: the further you pull, the less it moves.
      const eased = Math.min(MAX, dy * 0.5);
      pullRef.current = eased;
      setPull(eased);
    };
    const onEnd = () => {
      if (startY.current === null) return;
      startY.current = null;
      if (pullRef.current >= TRIGGER) {
        setRefreshing(true);
        onRefresh();
        window.setTimeout(() => setRefreshing(false), 900);
      }
      pullRef.current = 0;
      setPull(0);
    };

    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };
  }, [onRefresh, refreshing]);

  const visible = refreshing || pull > 4;
  if (!visible) return null;
  const progress = refreshing ? 1 : Math.min(1, pull / TRIGGER);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-30 flex justify-center lg:hidden"
      style={{ top: `calc(env(safe-area-inset-top, 0px) + 4.75rem + ${refreshing ? 8 : pull * 0.6}px)` }}
      aria-live="polite"
    >
      <span
        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-[#1B3C6C] shadow-md"
        style={{ opacity: Math.max(0.35, progress) }}
      >
        <RefreshCw
          className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
          style={refreshing ? undefined : { transform: `rotate(${progress * 270}deg)` }}
        />
        <span className="sr-only">{refreshing ? 'Refreshing' : 'Pull to refresh'}</span>
      </span>
    </div>
  );
}
