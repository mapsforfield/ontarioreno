// Client half of "view as rep" — see lib/view-as.ts for the server half, which
// is the half that actually enforces anything.
//
// All this does is remember which rep the admin is currently looking through
// and attach the header. If this file were bypassed entirely, the result would
// be an admin seeing their own portal — the safe direction. It cannot grant
// anything; only the server decides whether the header means anything at all.
//
// Stored in sessionStorage, not localStorage, on purpose: viewing as a rep is a
// thing you do for a few minutes, and it should not still be true tomorrow
// morning in a tab you forgot about. Closing the tab ends it.

const KEY = 'or_view_as';

/** The header name must match VIEW_AS_HEADER in lib/view-as.ts. */
export const VIEW_AS_HEADER = 'x-view-as';

export function getViewAsUserId(): string | null {
  try {
    const value = sessionStorage.getItem(KEY);
    return value && value.trim() ? value : null;
  } catch {
    // Private windows and locked-down browsers throw on access. Treat that as
    // "not viewing", which is the normal state anyway.
    return null;
  }
}

export function setViewAsUserId(userId: string | null): void {
  try {
    if (userId) sessionStorage.setItem(KEY, userId);
    else sessionStorage.removeItem(KEY);
  } catch {
    /* nothing to do — the feature is simply unavailable in this browser */
  }
}

/** Spread into a fetch's headers. Empty object when not viewing. */
export function viewAsHeaders(): Record<string, string> {
  const userId = getViewAsUserId();
  return userId ? { [VIEW_AS_HEADER]: userId } : {};
}
