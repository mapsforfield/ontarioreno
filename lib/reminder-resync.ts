// ─── Keeping queued reminders true ────────────────────────────────────────────
//
// Reminder SMS are composed and queued at BOOKING time, with the date and time
// written into the body text (see `planReminderNotifications`). That makes
// "what will this homeowner receive, and when" answerable from one table — but
// it also means a queued row is a snapshot. The moment an appointment moves,
// every pending reminder for it describes a visit that is not happening.
//
// Nothing here sends anything. These functions only rewrite outbox rows, and
// the drain remains the single place a message can leave the building. That is
// deliberate: a reschedule must never be able to trigger delivery as a side
// effect.

import { planReminderNotifications, type ReminderContext } from './notifications.js';

/** The reminder kinds whose wording is tied to a specific date and time. */
export const REMINDER_KINDS = ['reminder_24h', 'reminder_day_of'] as const;

/** Statuses where a visit is still expected to happen. */
const LIVE_STATUSES = ['scheduled', 'confirmed', 'rescheduled'];

/** What the appointment table knows, as far as a reminder is concerned. */
export type ReminderAppointment = {
  id: string;
  customerName?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  appointmentDate?: string | null;
  appointmentTime?: string | null;
  status?: string | null;
  deletedAt?: Date | string | null;
};

/** Build the reminder inputs from an appointment row. */
export function reminderContextFor(appointment: ReminderAppointment): ReminderContext {
  return {
    appointmentId: appointment.id,
    name: appointment.customerName ?? '',
    phone: appointment.phone ?? '',
    propertyAddress:
      [appointment.address, appointment.city].filter(Boolean).join(', ') ||
      (appointment.address ?? ''),
    date: appointment.appointmentDate ?? '',
    time: appointment.appointmentTime ?? '',
  };
}

export type ReminderVerdict =
  /** Deliver this wording — rebuilt from the appointment, not from the row. */
  | { action: 'send'; body: string; expiresAt: string }
  /** There is no visit to remind anyone about. */
  | { action: 'suppress'; reason: string }
  /** The visit moved later; push the row out to match and send nothing now. */
  | { action: 'defer'; sendAfter: string; expiresAt: string; body: string };

/**
 * Decide what a queued reminder should do, given the appointment as it stands
 * RIGHT NOW.
 *
 * This is the guarantee that a homeowner cannot be texted a stale date. Queued
 * rows are a schedule, not a script: the wording is rebuilt from the
 * appointment at the moment of sending, so a date change is picked up whether
 * or not anything remembered to resync the outbox when it happened. Adding a
 * new way to move an appointment cannot reintroduce the bug.
 */
export function reconcileReminder(
  appointment: ReminderAppointment | null,
  row: { kind: string },
  now: Date = new Date()
): ReminderVerdict {
  if (!appointment) return { action: 'suppress', reason: 'appointment_missing' };
  if (appointment.deletedAt) return { action: 'suppress', reason: 'appointment_deleted' };
  if (appointment.status && !LIVE_STATUSES.includes(appointment.status)) {
    return { action: 'suppress', reason: `appointment_${appointment.status}` };
  }
  if (!appointment.appointmentDate || !appointment.appointmentTime) {
    return { action: 'suppress', reason: 'appointment_has_no_slot' };
  }

  const context = reminderContextFor(appointment);
  if (!context.phone) return { action: 'suppress', reason: 'no_phone_on_appointment' };

  // The full schedule for the CURRENT slot, including windows that have already
  // opened — an elapsed send time is the reason to send, not to skip.
  const planned = planReminderNotifications(context, '', now, true);
  const match = planned.find((p) => p.kind === row.kind);
  if (!match) return { action: 'suppress', reason: 'reminder_not_applicable' };

  const at = now.toISOString();

  // Past its own window against the current slot: the visit was pulled earlier
  // and this wording ("tomorrow", or a visit already under way) is now false.
  if (match.expiresAt && match.expiresAt <= at) {
    return { action: 'suppress', reason: 'reminder_window_passed_for_current_slot' };
  }

  // The visit moved further out, so this reminder is early. Carry the row
  // forward instead of sending it — the homeowner hears from us once, at the
  // right time, about the right day.
  if (match.sendAfter > at) {
    return {
      action: 'defer',
      sendAfter: match.sendAfter,
      expiresAt: match.expiresAt,
      body: match.body,
    };
  }

  return { action: 'send', body: match.body, expiresAt: match.expiresAt };
}

/**
 * Minimal Prisma surface, passed in so this works inside a transaction and can
 * be driven by a fake in tests.
 */
export type ReminderStore = {
  notificationOutbox: {
    updateMany: (args: unknown) => Promise<{ count: number }>;
    upsert: (args: unknown) => Promise<unknown>;
  };
};

export type ResyncSummary = {
  /** Pending rows that described the old date and were stood down. */
  suppressed: number;
  /** Rows queued for the new date. Zero is normal and correct for a visit
   *  that is now too close for a reminder to be worth sending. */
  queued: number;
};

/**
 * Stand down every pending reminder for an appointment.
 *
 * Used on its own when a visit is cancelled or when a homeowner has ASKED to
 * move but the new slot is not confirmed yet — in both cases the right number
 * of reminders to have queued is zero.
 *
 * Only `pending` rows are touched. A reminder already delivered is history and
 * must keep saying so.
 */
export async function suppressPendingReminders(
  store: ReminderStore,
  appointmentId: string,
  reason: string
): Promise<number> {
  const result = await store.notificationOutbox
    .updateMany({
      where: {
        appointmentId,
        kind: { in: [...REMINDER_KINDS] },
        state: 'pending',
      },
      data: { state: 'suppressed', stateReason: reason },
    })
    .catch(() => ({ count: 0 }));
  return result.count;
}

/**
 * Point an appointment's reminders at the date and time it now actually has.
 *
 * Suppress-then-replan rather than editing the existing rows in place: the
 * suppressed rows stay in the table as a record of what was going to be sent
 * and why it wasn't, which is what you want when a homeowner asks "did you
 * text me about the old time?".
 *
 * Rows are upserted rather than inserted. A homeowner who moves from Tuesday
 * to Thursday and back to Tuesday would otherwise collide with the suppressed
 * Tuesday row on its unique idempotency key, silently insert nothing, and get
 * no reminder at all — the exact failure this module exists to prevent.
 */
export async function resyncAppointmentReminders(
  store: ReminderStore,
  appointment: ReminderContext,
  reason: string,
  now: Date = new Date()
): Promise<ResyncSummary> {
  const suppressed = await suppressPendingReminders(store, appointment.appointmentId, reason);

  const planned = planReminderNotifications(
    appointment,
    `${appointment.date}T${appointment.time}`,
    now
  );

  let queued = 0;
  for (const row of planned) {
    const written = await store.notificationOutbox
      .upsert({
        where: { idempotencyKey: row.idempotencyKey },
        create: {
          appointmentId: appointment.appointmentId,
          channel: row.channel,
          kind: row.kind,
          recipient: row.recipient,
          subject: row.subject,
          body: row.body,
          html: row.html ?? '',
          sendAfter: row.sendAfter,
          expiresAt: row.expiresAt,
          idempotencyKey: row.idempotencyKey,
        },
        // Reviving a slot the homeowner has returned to. The body is rewritten
        // too — the address or their name may have been corrected since — and
        // the delivery bookkeeping is reset so this counts as a fresh attempt
        // rather than inheriting a stale error from the first time round.
        update: {
          state: 'pending',
          stateReason: '',
          recipient: row.recipient,
          body: row.body,
          sendAfter: row.sendAfter,
          expiresAt: row.expiresAt,
          attempts: 0,
          lastError: '',
          sentAt: null,
        },
      })
      .then(() => true)
      .catch(() => false);
    if (written) queued++;
  }

  return { suppressed, queued };
}
