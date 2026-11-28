/**
 * Every booked consultation puts the homeowner in Clients.
 *
 * Portal hand-booking (POST /api/appointments) has always created or linked a
 * Client row. The public booking flow and `book_lead` never did, so a
 * homeowner who booked themselves was missing from Clients entirely — a rep
 * searched for "Deepkumar Patel" by name and by number and got nothing,
 * because there was nothing to find. 213 live bookings were in that state in
 * November 2026.
 *
 * Rules:
 * - Never a second client for the same homeowner: match an existing,
 *   non-deleted client on email, then on phone (last 10 digits).
 * - A match is linked, and only EMPTY fields on it are filled in. A rep's
 *   edits to an existing client are never overwritten by what a homeowner
 *   typed into a form.
 * - Events (showroom visit, supplier meeting, …) are not homeowners.
 * - Best-effort. Callers wrap this in try/catch: a failure here must never
 *   lose or fail the booking itself.
 */
import { EVENT_APPOINTMENT_TYPES } from './deal-from-appointment.js';

export type AppointmentForClient = {
  id: string;
  clientId?: string | null;
  deletedAt?: Date | null;
  appointmentType: string;
  customerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  projectType: string;
  assignedRepId: string;
  createdByUserId?: string | null;
};

export type ClientCandidate = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  postalCode?: string;
  projectTypes?: string[];
};

export const phoneDigitsKey = (p: string | null | undefined) => {
  const digits = String(p ?? '').replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : '';
};
const emailKey = (e: string | null | undefined) => String(e ?? '').trim().toLowerCase();

export function appointmentWantsClient(a: Pick<AppointmentForClient, 'clientId' | 'deletedAt' | 'appointmentType' | 'customerName'>): boolean {
  if (a.clientId) return false;
  if (a.deletedAt) return false;
  if (EVENT_APPOINTMENT_TYPES.includes(a.appointmentType)) return false;
  if (!String(a.customerName ?? '').trim()) return false;
  return true;
}

/** The homeowner's existing client, if any. Email first, then phone. */
export function matchClient(
  a: Pick<AppointmentForClient, 'email' | 'phone'>,
  candidates: ClientCandidate[]
): ClientCandidate | null {
  const email = emailKey(a.email);
  if (email) {
    const hit = candidates.find((c) => emailKey(c.email) === email);
    if (hit) return hit;
  }
  const phone = phoneDigitsKey(a.phone);
  if (phone) {
    const hit = candidates.find((c) => phoneDigitsKey(c.phone) === phone);
    if (hit) return hit;
  }
  return null;
}

/** Only the empty fields of an existing client — never overwrite a rep's edit. */
export function fillEmptyClientFields(existing: ClientCandidate, a: AppointmentForClient) {
  const data: Record<string, unknown> = {};
  const fill = (key: 'email' | 'phone' | 'address' | 'city' | 'postalCode', value: string) => {
    if (!String(existing[key] ?? '').trim() && String(value ?? '').trim()) data[key] = value.trim();
  };
  fill('email', a.email);
  fill('phone', a.phone);
  fill('address', a.address);
  fill('city', a.city);
  fill('postalCode', a.postalCode);
  const types = existing.projectTypes ?? [];
  if (a.projectType && !types.includes(a.projectType)) data.projectTypes = [...types, a.projectType];
  return data;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type ClientDb = {
  appointment: { findUnique: (args: any) => Promise<any>; update: (args: any) => Promise<any> };
  client: { findMany: (args: any) => Promise<any[]>; create: (args: any) => Promise<any>; update: (args: any) => Promise<any> };
};
/* eslint-enable @typescript-eslint/no-explicit-any */

export type EnsureClientResult =
  | { outcome: 'skipped' }
  | { outcome: 'linked'; clientId: string }
  | { outcome: 'created'; clientId: string };

export async function ensureClientForAppointment(db: ClientDb, appointmentId: string): Promise<EnsureClientResult> {
  const a = (await db.appointment.findUnique({ where: { id: appointmentId } })) as AppointmentForClient | null;
  if (!a || !appointmentWantsClient(a)) return { outcome: 'skipped' };

  const email = emailKey(a.email);
  const phone = phoneDigitsKey(a.phone);
  if (email || phone) {
    const or: Record<string, unknown>[] = [];
    if (email) or.push({ email: { equals: email, mode: 'insensitive' } });
    if (phone) or.push({ phone: { contains: phone.slice(-4) } });
    const candidates = (await db.client.findMany({
      where: { deletedAt: null, OR: or },
      select: { id: true, name: true, email: true, phone: true, address: true, city: true, postalCode: true, projectTypes: true },
    })) as ClientCandidate[];
    const existing = matchClient(a, candidates);
    if (existing) {
      const data = fillEmptyClientFields(existing, a);
      if (Object.keys(data).length > 0) await db.client.update({ where: { id: existing.id }, data });
      await db.appointment.update({ where: { id: a.id }, data: { clientId: existing.id } });
      return { outcome: 'linked', clientId: existing.id };
    }
  }

  const client = await db.client.create({
    data: {
      name: a.customerName.trim(),
      phone: a.phone ?? '',
      email: a.email ?? '',
      address: a.address ?? '',
      city: a.city ?? '',
      postalCode: a.postalCode ?? '',
      projectTypes: a.projectType ? [a.projectType] : [],
      internalNotes: '',
      source: 'appointment',
      // Client.createdByUserId is a required relation to User: the person who
      // booked it if there is one, else the assigned rep.
      createdByUserId: a.createdByUserId || a.assignedRepId,
    },
  });
  await db.appointment.update({ where: { id: a.id }, data: { clientId: client.id } });
  return { outcome: 'created', clientId: client.id };
}
