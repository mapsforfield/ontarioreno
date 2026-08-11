/**
 * Flag existing appointments in the remote-consultation cities.
 *
 *   npx tsx scripts/remote-consultation-backfill.ts            # dry run
 *   npx tsx scripts/remote-consultation-backfill.ts --apply    # writes
 *
 * Required env: DATABASE_URL
 *
 * Why: Appointment.remoteConsultation defaults to false, so every row written
 * before the feature shipped reads as an in-person visit. A FUTURE booking in
 * one of these cities that is still unflagged keeps anchoring that rep's
 * same-day travel radius on a city nobody is driving to, which pushes the next
 * leads on that date onto the other rep.
 *
 * Scope, deliberately narrow:
 *   * FUTURE dates only. A past appointment already happened, nothing routes
 *     around it any more, and rewriting it would only distort reporting.
 *   * ACTIVE statuses only. A cancelled row constrains nothing already.
 *   * The city must MATCH the list. Rows whose city is blank but whose address
 *     names a remote city are reported, never written — that is a judgement
 *     call for a person, and guessing it would silently rewrite real bookings.
 *
 * It sets remoteConsultation only. It does NOT touch appointmentType: that is
 * customer-visible wording on an appointment somebody has already been told
 * about, and changing what a booked homeowner was promised is not a migration's
 * decision to make. The scheduling damage is what this fixes.
 *
 * Dry run by default. Nothing is written without --apply.
 */
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';

neonConfig.webSocketConstructor = ws;

const ACTIVE_STATUSES = ['scheduled', 'confirmed', 'rescheduled', 'completed'];

function todayToronto(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

async function main(): Promise<void> {
  const apply = process.argv.includes('--apply');
  const { prisma } = await import('../lib/prisma.js');
  const { isRemoteConsultationCity, REMOTE_CONSULTATION_CITIES } = await import(
    '../lib/remote-consultation.js'
  );

  const today = todayToronto();
  console.log(`\nMode:    ${apply ? 'APPLY (will write)' : 'DRY RUN (writes nothing)'}`);
  console.log(`Cities:  ${REMOTE_CONSULTATION_CITIES.join(', ')}`);
  console.log(`Today:   ${today}\n`);

  const rows = await prisma.appointment.findMany({
    where: {
      deletedAt: null,
      appointmentDate: { gte: today },
      status: { in: ACTIVE_STATUSES },
      remoteConsultation: false,
    },
    select: {
      id: true,
      customerName: true,
      city: true,
      address: true,
      appointmentDate: true,
      appointmentTime: true,
      appointmentType: true,
      status: true,
      publicReference: true,
    },
    orderBy: [{ appointmentDate: 'asc' }, { appointmentTime: 'asc' }],
  });

  const toFlag = rows.filter((a) => isRemoteConsultationCity(a.city));
  const suspects = rows.filter(
    (a) =>
      !isRemoteConsultationCity(a.city) &&
      REMOTE_CONSULTATION_CITIES.some((city) => (a.address ?? '').toLowerCase().includes(city))
  );

  console.log(`=== WOULD FLAG (${toFlag.length}) ===`);
  if (toFlag.length === 0) console.log('  none — nothing to fix');
  for (const a of toFlag) {
    console.log(
      `  ${a.appointmentDate} ${a.appointmentTime ?? '—'}  ${a.customerName ?? '—'}  (${a.city})  ${a.status}  ${a.publicReference ?? a.id}`
    );
  }

  if (suspects.length > 0) {
    console.log(`\n=== NOT touched — address names a remote city but the city field does not (${suspects.length}) ===`);
    console.log('Confirm these by hand; the script will not guess at them.');
    for (const a of suspects) {
      console.log(`  ${a.appointmentDate} ${a.appointmentTime ?? '—'}  ${a.customerName ?? '—'}  city="${a.city}"  address="${a.address}"`);
    }
  }

  if (!apply) {
    console.log('\nDry run — nothing was written. Re-run with --apply to make these changes.');
    await prisma.$disconnect();
    return;
  }

  if (toFlag.length === 0) {
    console.log('\nNothing to write.');
    await prisma.$disconnect();
    return;
  }

  const result = await prisma.appointment.updateMany({
    where: { id: { in: toFlag.map((a) => a.id) } },
    data: { remoteConsultation: true },
  });
  console.log(`\nFlagged ${result.count} appointment(s) as remote consultations.`);
  console.log('Their reps’ days are no longer anchored on those cities.');

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
