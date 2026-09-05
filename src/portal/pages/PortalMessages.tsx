import { useState } from 'react';

/**
 * Twilio Messages — the SMS dashboard, reachable from anywhere.
 *
 * It used to run as a local Express app on one office machine (127.0.0.1:3000),
 * so the only way to read or answer a text was to be sitting at that desk. The
 * dashboard itself is unchanged: it is served as a static page
 * (public/portal-twilio-dashboard.html) and framed here, with the portal's own
 * admin guard in front of it and api/twilio/index.ts behind it.
 *
 * Framed rather than ported to React on purpose. The dashboard is ~1,900 lines
 * of working UI a rep already knows — the drawers, the unread dots, the resize
 * handle, the ding on a new inbound. Re-deriving all of that in React would
 * have meant losing details nobody wrote down.
 *
 * Reachable by URL and from the Admin page. No sidebar link, by request.
 */

export default function PortalMessages() {
  // Remounting the frame is the whole recovery path when iOS kills its render
  // process ("A problem repeatedly occurred"). Reps were closing and reopening
  // the portal page to get back in; a button that reloads just the frame does
  // the same thing without losing the portal session around it.
  const [frameKey, setFrameKey] = useState(0);

  return (
    // 100dvh, not 100vh: on mobile Safari 100vh is the height WITHOUT the
    // browser's own chrome, so the composer ended up under the address bar.
    // The subtraction covers the portal's fixed mobile header and bottom nav.
    <div className="flex h-[calc(100dvh-19rem)] min-h-[24rem] flex-col gap-2 lg:h-[calc(100vh-9rem)] lg:gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Admin
        </p>
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold text-slate-900 lg:text-2xl">Twilio Messages</h1>
          <button
            type="button"
            onClick={() => setFrameKey((key) => key + 1)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Reload
          </button>
        </div>
        {/* Orientation for a first visit, not something a rep re-reads daily —
            on a phone that is three lines of screen the thread needs more. */}
        <p className="hidden text-sm text-slate-500 lg:block">
          Read and reply to SMS on the company numbers. Sends here are hand-typed
          and go straight to Twilio — they are not part of any automated sequence.
        </p>
      </div>

      {/* Edge-to-edge on a phone: the page gutters already inset it, and a
          second rounded border inside them costs line length in every bubble. */}
      <iframe
        key={frameKey}
        src="/portal-twilio-dashboard.html"
        title="Twilio Messages"
        className="-mx-4 min-h-0 w-[calc(100%+2rem)] flex-1 border-y border-slate-200 bg-white sm:mx-0 sm:w-full sm:rounded-xl sm:border sm:shadow-sm"
      />
    </div>
  );
}
