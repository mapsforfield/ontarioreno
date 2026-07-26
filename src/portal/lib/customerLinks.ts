import type { CustomerActionLinks } from '../data/emailTemplates';

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
