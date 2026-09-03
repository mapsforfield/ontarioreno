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
  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Admin
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">Twilio Messages</h1>
        <p className="text-sm text-slate-500">
          Read and reply to SMS on the company numbers. Sends here are hand-typed
          and go straight to Twilio — they are not part of any automated sequence.
        </p>
      </div>

      <iframe
        src="/portal-twilio-dashboard.html"
        title="Twilio Messages"
        className="min-h-0 w-full flex-1 rounded-xl border border-slate-200 bg-white shadow-sm"
      />
    </div>
  );
}
