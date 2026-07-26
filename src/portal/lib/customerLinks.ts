import { useEffect, useState } from 'react';
import type { CustomerActionLinks } from '../data/emailTemplates';

export type CustomerLinkAction = 'reschedule' | 'cancel';

/**
 * Result of asking the server whether a customer link is genuinely valid.
 *
 * 'checking' must render neither the form nor a failure — the browser cannot
 * verify a token itself (the signing secret is server-side only), so the mere
 * presence of a `t` parameter proves nothing and must never gate the UI.
 */
export type CustomerLinkState =
  | { status: 'checking' }
  | { status: 'valid'; siblingToken: string }
  | { status: 'invalid' };

/**
 * Server-verified gate for the reschedule/cancel pages.
 *
 * The server checks signature, expiry, appointment id AND action purpose before
 * we render any mutation control. Anything other than an explicit `valid: true`
 * — including a network failure — is treated as invalid, so the page fails
 * closed rather than exposing controls on an unverified token.
 */
export function useCustomerLinkCheck(
  appointmentId: string | undefined,
  action: CustomerLinkAction,
  token: string
): CustomerLinkState {
  const [state, setState] = useState<CustomerLinkState>({ status: 'checking' });

  useEffect(() => {
    if (!appointmentId || !token) {
      setState({ status: 'invalid' });
      return;
    }
    let alive = true;
    setState({ status: 'checking' });
    // `linkAction`, not `action`: /api/auth/[action] is a Vercel dynamic route,
    // so `action` is already taken by the path segment.
    const query = new URLSearchParams({ appointmentId, linkAction: action, t: token });
    fetch(`/api/auth/customer-link-check?${query.toString()}`)
      .then(async (res) => {
        if (!alive) return;
        if (!res.ok) {
          setState({ status: 'invalid' });
          return;
        }
        const data = (await res.json()) as { valid?: boolean; siblingToken?: string };
        if (data?.valid === true) {
          setState({ status: 'valid', siblingToken: data.siblingToken ?? '' });
        } else {
          setState({ status: 'invalid' });
        }
      })
      .catch(() => {
        // Fail closed — never render mutation controls on an unverified token.
        if (alive) setState({ status: 'invalid' });
      });
    return () => {
      alive = false;
    };
  }, [appointmentId, action, token]);

  return state;
}

/**
 * Fetch the signed reschedule/cancel URLs for an appointment.
 *
 * The signing secret lives only on the server, so the portal asks for links
 * rather than building them. Returns null on any failure — callers must render
 * the email without action links rather than falling back to unsigned URLs.
 */
export async function fetchCustomerLinks(
  appointmentId: string
): Promise<CustomerActionLinks | null> {
  if (!appointmentId) return null;
  try {
    const res = await fetch(
      `/api/auth/customer-links?appointmentId=${encodeURIComponent(appointmentId)}`,
      { credentials: 'include' }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as Partial<CustomerActionLinks>;
    if (typeof data?.rescheduleUrl !== 'string' || typeof data?.cancelUrl !== 'string') {
      return null;
    }
    return { rescheduleUrl: data.rescheduleUrl, cancelUrl: data.cancelUrl };
  } catch {
    return null;
  }
}
