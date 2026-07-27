// ─── Global application switches ──────────────────────────────────────────────
// Shared by the public flow and the API. No Node imports — this is bundled into
// the browser.

/**
 * Master switch for the yellow "TESTING MODE — ROUTING DETAIL" banner.
 *
 * FALSE in production traffic. When false the panel is hidden on every step
 * regardless of host or query string — there is deliberately no `?debug=1`
 * override, because a debug affordance a stranger can turn on is not off.
 *
 * Flip to true, redeploy to a preview, and the routing reasons come back.
 */
export const ENABLE_TESTING_MODE = false;

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
