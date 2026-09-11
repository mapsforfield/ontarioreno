// "View as rep" — letting an admin see the portal exactly as one of their reps.
//
// The whole point is that this is enforced on the SERVER. A client-side user
// swap would still be fetching admin-scoped responses, so the admin would be
// looking at their own data wearing a rep's name — which is worse than no
// feature at all, because it would answer "is anything leaking to reps?" with
// a confident and wrong "no".
//
// ── The safety property ──────────────────────────────────────────────────────
// This mechanism can only ever NARROW access. Read it as three rules:
//
//   1. The header is honoured only when the real, cookie-authenticated user is
//      an admin. For anyone else it is ignored completely — not an error, just
//      ignored, so a rep who finds the header in devtools and sends it gains
//      exactly nothing.
//   2. The effective user it produces is a rep. An admin viewing as a rep is
//      therefore refused by every admin-only endpoint, because those check the
//      effective role.
//   3. Writes are blocked outright while viewing (enforced in requireAuth). An
//      audit tool must not be able to change anything on a rep's behalf, and a
//      write attributed to someone who wasn't there is a lie in the activity
//      log.
//
// There is no path through here that grants anything the caller did not
// already have. If that ever stops being true, the tests below should fail.

import type { VercelRequest } from '@vercel/node';

/** The header the portal sends. Client-controlled, and deliberately harmless. */
export const VIEW_AS_HEADER = 'x-view-as';

export type ViewAsCandidate = {
  id: string;
  role: string;
  active: boolean;
};

/**
 * Read the requested view-as target id, or null.
 *
 * Returns null for a non-admin without inspecting the value at all, so the
 * refusal never depends on anything about the target.
 */
export function requestedViewAsId(
  req: Pick<VercelRequest, 'headers'>,
  realUser: { role: string } | null
): string | null {
  if (realUser?.role !== 'admin') return null;
  const raw = req.headers[VIEW_AS_HEADER];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Is this a user an admin may view as?
 *
 * Reps only. Not another admin — viewing as an admin would be a sideways move
 * that grants nothing and invites the mistake of thinking it is a safe way to
 * act as someone else. Not a contractor either: contractor accounts are a
 * different, narrower thing and are refused at the door by denyContractor
 * anyway. Not an inactive account, and not yourself.
 */
export function canViewAs(
  realUser: { id: string; role: string },
  target: ViewAsCandidate | null
): boolean {
  if (realUser.role !== 'admin') return false;
  if (!target) return false;
  if (!target.active) return false;
  if (target.id === realUser.id) return false;
  return target.role === 'rep';
}

/** Methods that are allowed while viewing as someone else. Reads only. */
const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function isReadOnlyMethod(method: string | undefined): boolean {
  return READ_METHODS.has((method ?? 'GET').toUpperCase());
}
