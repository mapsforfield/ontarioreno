/**
 * READ-ONLY audit: appointments in the remote-consultation cities, and whether
 * each one is flagged as a call. Writes NOTHING.
 *
 *   npx tsx scripts/remote-consultation-audit.ts
 *
 * Why this exists: Appointment.remoteConsultation defaults to false, so every
 * row written before the feature shipped reads as an in-person visit. A FUTURE
 * booking in one of these cities that is still unflagged is not cosmetic — it
 * anchors that rep's same-day travel radius on a city nobody is driving to, so
 * the next leads on that date are pushed to the other rep. That is the exact
 * bug the feature fixes, still running on any date the calendar has not
 * reached yet.
 *
 * Past appointments are reported separately and deliberately NOT counted as a
 * problem: they already happened, nothing routes around them any more, and
 * rewriting them would only distort reporting.
 *
 * Required env: DATABASE_URL
 */
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';

neonConfig.webSocketConstructor = ws;

/** Statuses where the appointment still occupies the calendar. */
const ACTIVE_STATUSES = ['scheduled', 'confirmed', 'rescheduled', 'completed'];

function pad(s: string, n: number): string {
  const v = s.length > n ? s.slice(0, n - 1) + '…' : s;
  return v + ' '.repeat(Math.max(0, n - v.length));
}

/** Today in Ontario, as YYYY-MM-DD — appointmentDate is a wall-clock string. */
function todayToronto(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export async function runRemoteAudit(): Promise<void> {
  const { prisma } = await import('../lib/prisma.js');
  const { REMOTE_CONSULTATION_CITIES, isRemoteConsultationCity } = await import(
    '../lib/remote-consultation.js'
  );

  const today = todayToronto();
  console.log(`\nRemote-consultation cities: ${REMOTE_CONSULTATION_CITIES.join(', ')}`);
  console.log(`Today (Ontario):            ${today}`);

  // Read broadly and filter in code rather than with a SQL city predicate:
  // matching is normalised (case, spacing) in one place, and a row whose city
  // is blank but whose address names the city still has to be eyeballed.
  const appointments = await prisma.appointment.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      customerName: true,
      city: true,
      address: true,
      appointmentDate: true,
      appointmentTime: true,
      appointmentType: true,
      status: true,
      assignedRepId: true,
      remoteConsultation: true,
      publicReference: true,
    },
    orderBy: [{ appointmentDate: 'asc' }, { appointmentTime: 'asc' }],
  });

  const reps = await prisma.user.findMany({ select: { id: true, name: true } });
  const repName = new Map(reps.map((r) => [r.id, r.name]));

  const inRemoteCity = appointments.filter((a) => isRemoteConsultationCity(a.city));
  const future = inRemoteCity.filter((a) => (a.appointmentDate ?? '') >= today);
  const past = inRemoteCity.filter((a) => (a.appointmentDate ?? '') < today);
  const active = (a: { status: string | null }) => ACTIVE_STATUSES.includes(a.status ?? '');

  const row = (a: (typeof appointments)[number]) =>
    pad(a.appointmentDate ?? '—', 12) +
    pad(a.appointmentTime ?? '—', 7) +
    pad(a.customerName ?? '—', 22) +
    pad(a.city ?? '—', 16) +
    pad(repName.get(a.assignedRepId ?? '') ?? a.assignedRepId ?? '—', 12) +
    pad(a.status ?? '—', 12) +
    pad(a.appointmentType ?? '—', 20) +
    (a.remoteConsultation ? 'flagged' : 'NOT FLAGGED');

  const header =
    pad('DATE', 12) + pad('TIME', 7) + pad('CUSTOMER', 22) + pad('CITY', 16) +
    pad('REP', 12) + pad('STATUS', 12) + pad('TYPE', 20) + 'REMOTE?';

  // ── The one that matters ──
  console.log('\n=== FUTURE appointments in remote cities ===');
  console.log('An active, unflagged row here is still anchoring that rep\'s day.');
  console.log(header);
  if (future.length === 0) console.log('  none');
  for (const a of future) console.log('  ' + row(a));

  console.log('\n=== PAST appointments in remote cities (context only — leave alone) ===');
  console.log(header);
  if (past.length === 0) console.log('  none');
  for (const a of past) console.log('  ' + row(a));

  // ── Rows the city column cannot see ──
  // A hand-entered portal booking often has a blank city with the municipality
  // sitting in the address line. Those are invisible to the check above, so
  // they are surfaced for a human rather than silently passed.
  const suspects = appointments.filter(
    (a) =>
      !isRemoteConsultationCity(a.city) &&
      (a.appointmentDate ?? '') >= today &&
      REMOTE_CONSULTATION_CITIES.some((city) =>
        (a.address ?? '').toLowerCase().includes(city)
      )
  );
  console.log('\n=== FUTURE rows whose ADDRESS names a remote city but whose CITY does not ===');
  console.log('Usually a hand-entered booking. Needs a human to confirm before flagging.');
  if (suspects.length === 0) console.log('  none');
  for (const a of suspects) {
    console.log(`  ${a.appointmentDate} ${a.appointmentTime}  ${a.customerName}  city="${a.city}"  address="${a.address}"`);
  }

  // ── Summary ──
  const needsFlag = future.filter((a) => !a.remoteConsultation && active(a));
  console.log('\n=== SUMMARY ===');
  console.log(`appointments in remote cities:      ${inRemoteCity.length}`);
  console.log(`  future:                           ${future.length}`);
  console.log(`  past:                             ${past.length}`);
  console.log(`FUTURE + active + NOT flagged:      ${needsFlag.length}   <- these still distort routing`);
  console.log(`address-only suspects (future):     ${suspects.length}`);

  if (needsFlag.length > 0) {
    console.log('\nThe rows that would change if you backfill:');
    for (const a of needsFlag) {
      console.log(`  ${a.appointmentDate} ${a.appointmentTime}  ${a.customerName ?? '—'}  (${a.city})  ${a.publicReference ?? a.id}`);
    }
    console.log('\nNothing has been changed. This script only reads.');
  }

  await prisma.$disconnect();
}

if (process.argv[1] && process.argv[1].includes('remote-consultation-audit')) {
  runRemoteAudit().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
