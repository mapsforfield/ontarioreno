/**
 * Preview-only seed — synthetic admin, rep and one test appointment.
 *
 * Exists so the isolated Preview database has just enough data to exercise ONE
 * genuine reschedule link and ONE genuine cancel link end to end. It is not a
 * general fixture set and must never touch production.
 *
 * Refuses to run unless BOTH hold:
 *   1. VERCEL_ENV=preview                          (deliberate opt-in)
 *   2. the resolved connection variable's NAME begins with PREVIEW_DATABASE_
 *
 * (2) is the real guarantee: resolveDatabaseSource never consults the unprefixed
 * production variables while VERCEL_ENV is 'preview', and this script additionally
 * asserts on the name it got back, so it cannot be aimed at production even if
 * the environment is misconfigured.
 *
 * Idempotent — upserts by fixed synthetic ids, so re-running updates rather than
 * duplicating. Prints no secrets: never the password, never a connection string.
 *
 * Requires three environment variables at run time, none of which are stored in
 * this repository:
 *   VERCEL_ENV=preview
 *   PREVIEW_DATABASE_<suffix>       the Preview pooled connection string
 *   PREVIEW_SEED_ADMIN_PASSWORD     throwaway password for the synthetic admin
 *
 * PowerShell, from the repository root (substitute the two placeholders):
 *
 *   $env:VERCEL_ENV = 'preview'
 *   $env:PREVIEW_DATABASE_POSTGRES_PRISMA_URL = '<preview pooled connection string>'
 *   $env:PREVIEW_SEED_ADMIN_PASSWORD = '<throwaway password, 12+ chars>'
 *   npx tsx scripts/seed-preview.ts
 *
 * Use a throwaway terminal: those values persist in that shell's environment and
 * in PowerShell history. Close it when finished.
 */

import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '../src/generated/prisma/client.ts';
import bcrypt from 'bcryptjs';
import { resolveDatabaseSource, PREVIEW_PREFIX } from '../lib/db-url.js';

// ─── Synthetic identities ─────────────────────────────────────────────────────
// example.test is RFC 6761 reserved: it cannot resolve and cannot receive mail.
const ADMIN = {
  id: 'preview-admin',
  name: 'Preview Admin (synthetic)',
  email: 'preview-admin@example.test',
  role: 'admin',
  avatarInitial: 'P',
};
const REP = {
  id: 'preview-rep',
  name: 'Preview Rep (synthetic)',
  email: 'preview-rep@example.test',
  role: 'rep',
  avatarInitial: 'R',
};
const APPOINTMENT_ID = 'preview-appointment-001';
const CUSTOMER = {
  name: 'Preview Test Customer (synthetic)',
  email: 'preview-customer@example.test',
  phone: '000-000-0000',
  address: '1 Preview Street',
  city: 'Hamilton',
  postalCode: 'L8P 1A1',
};

const MIN_PASSWORD_LENGTH = 12;

function fail(message: string): never {
  console.error(`\n[seed-preview] REFUSING TO RUN\n  ${message}\n`);
  process.exit(1);
}

/** YYYY-MM-DD, `days` from now, in Ontario time (matches how the portal reads dates). */
function torontoDatePlus(days: number): string {
  const instant = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

async function main() {
  // ── Guard 1: explicit preview opt-in ──
  if (process.env.VERCEL_ENV !== 'preview') {
    fail(
      'VERCEL_ENV must be exactly "preview". This script only ever seeds the isolated ' +
        'Preview database; it will not run against production or an unlabelled environment.'
    );
  }

  // ── Guard 2: the URL must have come from a PREVIEW_DATABASE_* variable ──
  // resolveDatabaseSource throws if VERCEL_ENV=preview and no prefixed variable
  // is set — it never falls back to POSTGRES_PRISMA_URL / DATABASE_URL.
  let source: { key: string; url: string };
  try {
    source = resolveDatabaseSource();
  } catch (err) {
    fail(err instanceof Error ? err.message : String(err));
  }
  if (!source.key.startsWith(PREVIEW_PREFIX)) {
    fail(
      `The connection string came from "${source.key}", which is not a ${PREVIEW_PREFIX}* ` +
        'variable. Refusing to seed a database that may be production.'
    );
  }
  if (!source.url) {
    fail(`"${source.key}" is set but empty.`);
  }

  // ── Guard 3: password supplied by environment, never hardcoded ──
  const password = process.env.PREVIEW_SEED_ADMIN_PASSWORD ?? '';
  if (password.length < MIN_PASSWORD_LENGTH) {
    fail(
      `PREVIEW_SEED_ADMIN_PASSWORD must be set and at least ${MIN_PASSWORD_LENGTH} characters. ` +
        'Generate a throwaway value; it is never written to this repository.'
    );
  }

  // Variable NAME only — the connection string is never printed.
  console.log(`[seed-preview] database source: ${source.key}`);

  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: source.url }),
  } as never);

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    for (const user of [ADMIN, REP]) {
      const shared = {
        name: user.name,
        email: user.email,
        role: user.role,
        avatarInitial: user.avatarInitial,
        active: true,
      };
      await prisma.user.upsert({
        where: { id: user.id },
        update: { ...shared, passwordHash },
        create: { id: user.id, ...shared, passwordHash },
      });
      console.log(`[seed-preview] user ready: ${user.email} (${user.role})`);
    }

    const appointment = {
      customerName: CUSTOMER.name,
      phone: CUSTOMER.phone,
      email: CUSTOMER.email,
      address: CUSTOMER.address,
      city: CUSTOMER.city,
      postalCode: CUSTOMER.postalCode,
      projectType: 'Preview Test — Legal Secondary Suite',
      assignedRepId: REP.id,
      createdByUserId: ADMIN.id,
      appointmentDate: torontoDatePlus(7),
      appointmentTime: '10:00', // 24-hour "HH:MM" — the only accepted format
      durationMinutes: 60,
      appointmentType: 'home_visit',
      status: 'scheduled',
      source: 'manual',
      customerNotes: 'Synthetic record created by scripts/seed-preview.ts. Not a real customer.',
      internalNotes: 'PREVIEW TEST DATA — safe to delete.',
    };

    await prisma.appointment.upsert({
      where: { id: APPOINTMENT_ID },
      update: appointment,
      create: { id: APPOINTMENT_ID, ...appointment },
    });

    console.log(`[seed-preview] appointment ready: ${APPOINTMENT_ID}`);
    console.log(`[seed-preview]   ${appointment.appointmentDate} at ${appointment.appointmentTime} ET, rep ${REP.email}`);
    console.log('\n[seed-preview] done. Sign in to the Preview portal as');
    console.log(`  ${ADMIN.email}  (password: the value you passed in PREVIEW_SEED_ADMIN_PASSWORD)`);
    console.log('then open the appointment and use the portal to mint the customer links.\n');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  // Print the message only — a Prisma error can otherwise echo the connection string.
  console.error(`[seed-preview] failed: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
