// ─── Global application switches ──────────────────────────────────────────────
// Shared by the public flow and the API. No Node imports — this is bundled into
// the browser.

/**
 * Hard kill switch for the routing-detail panel.
 *
 * Set to false and the panel is gone everywhere, no exceptions. Left true so the
 * host rule below applies: hidden on the live domain, visible while testing.
 */
export const TESTING_MODE_MASTER = true;

/** Hosts that count as live production traffic. */
const PRODUCTION_HOST = /(^|\.)ontarioreno\.ca$/i;

/**
 * Whether to show the routing-detail panel.
 *
 * Off for live production traffic — a customer must never see internal routing
 * codes. On everywhere else (preview deployments, local), because that is where
 * the flow is tested and a manual-review result is useless without knowing which
 * answer caused it.
 *
 * An earlier version of this was a flat `false`, which correctly hid the panel in
 * production and also blinded testing on preview. The environment, not a single
 * boolean, is what should decide.
 */
export function testingModeEnabled(hostname?: string | null): boolean {
  if (!TESTING_MODE_MASTER) return false;
  if (!hostname) return false;
  return !PRODUCTION_HOST.test(hostname);
}

/**
 * Real outbound messages are sent from production only.
 *
 * RESEND_API_KEY is the live key and is scoped to Preview as well as Production,
 * so without this guard a preview test booking would email the real business
 * inbox and the address a tester typed in. Preview still writes every outbox row
 * so the pipeline is fully observable — it just doesn't hand anything to a
 * provider.
 */
export function deliveryEnabled(env: { VERCEL_ENV?: string } = process.env): boolean {
  return env.VERCEL_ENV === 'production';
}
