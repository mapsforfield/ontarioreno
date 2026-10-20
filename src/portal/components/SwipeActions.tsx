import { useRef, useState, type ReactNode } from 'react';

export type SwipeAction = {
  key: string;
  label: string;
  icon: ReactNode;
  className: string;
  /** A link (tel:, sms:) or a handler. */
  href?: string;
  onSelect?: () => void;
};

const ACTION_WIDTH = 72;

/**
 * iOS-style swipe-left-to-reveal actions on a phone. Touch only: a mouse never
 * triggers it, so desktop drag-and-drop on the deal board is untouched.
 *
 * The gesture only claims the touch once it is clearly horizontal, so vertical
 * scrolling through the list feels exactly as before.
 */
export default function SwipeActions({
  actions,
  enabled = true,
  children,
}: {
  actions: SwipeAction[];
  enabled?: boolean;
  children: ReactNode;
}) {
  const max = actions.length * ACTION_WIDTH;
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ x: number; y: number; base: number; axis: 'x' | 'y' | null } | null>(null);
  const moved = useRef(false);

  if (!enabled || actions.length === 0) return <>{children}</>;

  const close = () => setOffset(0);

  return (
    <div className="relative overflow-hidden rounded-[0.5rem]">
      <div className="absolute inset-y-0 right-0 flex" style={{ width: max }} aria-hidden={offset === 0}>
        {actions.map((a) => {
          const body = (
            <>
              {a.icon}
              <span className="text-[0.65rem] font-black">{a.label}</span>
            </>
          );
          const cls = `flex h-full flex-col items-center justify-center gap-1 text-white ${a.className}`;
          return a.href ? (
            <a key={a.key} href={a.href} onClick={close} className={cls} style={{ width: ACTION_WIDTH }} tabIndex={offset === 0 ? -1 : 0}>
              {body}
            </a>
          ) : (
            <button
              key={a.key}
              type="button"
              onClick={() => { close(); a.onSelect?.(); }}
              className={cls}
              style={{ width: ACTION_WIDTH }}
              tabIndex={offset === 0 ? -1 : 0}
            >
              {body}
            </button>
          );
        })}
      </div>
      <div
        className="relative"
        style={{
          transform: `translate3d(${offset}px,0,0)`,
          transition: dragging ? 'none' : 'transform 220ms cubic-bezier(.2,.8,.2,1)',
        }}
        onTouchStart={(e) => {
          const t = e.touches[0];
          start.current = { x: t.clientX, y: t.clientY, base: offset, axis: null };
          moved.current = false;
        }}
        onTouchMove={(e) => {
          const s = start.current;
          if (!s) return;
          const t = e.touches[0];
          const dx = t.clientX - s.x;
          const dy = t.clientY - s.y;
          if (s.axis === null) {
            if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
            s.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
          }
          if (s.axis !== 'x') return;
          moved.current = true;
          setDragging(true);
          setOffset(Math.max(-max - 24, Math.min(0, s.base + dx)));
        }}
        onTouchEnd={() => {
          const s = start.current;
          start.current = null;
          setDragging(false);
          if (!s || s.axis !== 'x') return;
          setOffset((o) => (o < -max / 2 ? -max : 0));
        }}
        onClickCapture={(e) => {
          // A swipe must not also count as a tap that opens the card, and a
          // tap on an open row just closes it.
          if (moved.current || offset !== 0) {
            e.preventDefault();
            e.stopPropagation();
            moved.current = false;
            if (offset !== 0) close();
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}
