import ws from 'ws';
import bcrypt from 'bcryptjs';
import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '../src/generated/prisma/client.js';

// ── One-shot account recovery ────────────────────────────────────────────────
// Usage (PowerShell):
//   $env:DATABASE_URL="postgresql://…"        # from Neon → Connect
//   $env:RESET_EMAIL="sabahohs@gmail.com"     # optional, defaults below
//   $env:NEW_PASSWORD="your-new-password"     # optional; omit to just diagnose
//   npx tsx scripts/reset-admin.ts
//
// Without NEW_PASSWORD it ONLY reports the account state (read-only).
// With NEW_PASSWORD it sets active=true and updates the password hash.

neonConfig.webSocketConstructor = ws;
const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? '';
if (!connectionString || /johndoe|localhost/.test(connectionString)) {
  console.error('✗ Set DATABASE_URL to your REAL Neon connection string first (not the placeholder).');
  process.exit(1);
}

const email = (process.env.RESET_EMAIL ?? 'sabahohs@gmail.com').toLowerCase().trim();
const newPassword = process.env.NEW_PASSWORD ?? '';

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter } as never);

const user = await prisma.user.findUnique({
  where: { email },
  select: { id: true, name: true, role: true, active: true, passwordHash: true },
});

if (!user) {
  console.error(`✗ No user found for ${email}.`);
  const all = await prisma.user.findMany({ select: { email: true, role: true, active: true } });
  console.log('Existing accounts:', JSON.stringify(all, null, 2));
  await prisma.$disconnect();
  process.exit(1);
}

console.log('── Account state ──────────────────────────────');
console.log(`  email:        ${email}`);
console.log(`  name:         ${user.name}`);
console.log(`  role:         ${user.role}`);
console.log(`  active:       ${user.active}${user.active ? '' : '   ← this blocks login'}`);
console.log(`  hasPassword:  ${Boolean(user.passwordHash)}${user.passwordHash ? '' : '   ← this blocks login'}`);
console.log('───────────────────────────────────────────────');

if (!newPassword) {
  console.log('\nRead-only run (no NEW_PASSWORD set). Nothing changed.');
  console.log('To reset: set NEW_PASSWORD and run again.');
  await prisma.$disconnect();
  process.exit(0);
}

if (newPassword.length < 8) {
  console.error('✗ NEW_PASSWORD must be at least 8 characters.');
  await prisma.$disconnect();
  process.exit(1);
}

const passwordHash = await bcrypt.hash(newPassword, 10);
await prisma.user.update({ where: { email }, data: { active: true, passwordHash } });
console.log(`\n✓ Done. ${email} is now active with the new password. Try signing in.`);
await prisma.$disconnect();
