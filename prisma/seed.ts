/**
 * Seed script — populates the Neon database with initial portal data.
 * Run with: npm run db:seed
 *
 * Safe to re-run: uses upsert so existing records are updated, not duplicated.
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '../src/generated/prisma/client.ts';
import bcrypt from 'bcryptjs';

const connectionString = process.env.POSTGRES_PRISMA_URL ?? process.env.DATABASE_URL ?? '';
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter } as never);

// ─── Users ────────────────────────────────────────────────────────────────────
const USERS = [
  {
    id: 'sabah',
    name: 'Sabah',
    role: 'admin',
    email: 'sabahohs@gmail.com',
    avatarInitial: 'S',
    avatarUrl: null as string | null,
    password: 'admin123',
  },
  {
    id: 'oliver',
    name: 'Oliver',
    role: 'rep',
    email: 'David.galaxykitchenrenovation@gmail.com',
    avatarInitial: 'O',
    avatarUrl: '/images/oliverpp.png' as string | null,
    password: 'oliver123',
  },
  {
    id: 'xavier',
    name: 'Xavier',
    role: 'rep',
    email: 'kb.live13@gmail.com',
    avatarInitial: 'X',
    avatarUrl: '/images/kevenpp.png' as string | null,
    password: 'xavier123',
  },
];

// ─── Contractors ──────────────────────────────────────────────────────────────
const CONTRACTORS = [
  {
    id: 'perahome',
    companyName: 'PeraHome',
    contactName: 'Serhat',
    phone: '416-555-0101',
    email: 'serhat@perahome.ca',
    website: 'https://perahome.ca',
    financingStatus: 'financing_available',
    contractorStatus: 'active',
    serviceAreas: ['Toronto', 'Mississauga', 'Oakville'],
    projectTypes: ['Full renovation', 'Basements'],
    averageProjectSize: 85000,
    notes: 'Strong fit for larger financed renovation projects.',
    priorityScore: 92,
  },
  {
    id: 'galaxy-renovations',
    companyName: 'Galaxy Renovations',
    contactName: 'PJ',
    phone: '416-555-0102',
    email: 'pj@galaxyrenovations.ca',
    website: 'https://galaxyrenovations.ca',
    financingStatus: 'financing_available',
    contractorStatus: 'active',
    serviceAreas: ['Hamilton', 'Burlington', 'St. Catharines'],
    projectTypes: ['Basements', 'Legal suites'],
    averageProjectSize: 70000,
    notes: 'Reliable partner for Hamilton region.',
    priorityScore: 88,
  },
  {
    id: 'efficiency-home',
    companyName: 'Efficiency Home Renovations',
    contactName: 'Mike',
    phone: '905-555-0103',
    email: 'mike@efficiencyhome.ca',
    website: 'https://efficiencyhome.ca',
    financingStatus: 'cash_only',
    contractorStatus: 'active',
    serviceAreas: ['Brampton', 'Mississauga', 'Milton'],
    projectTypes: ['Basements', 'Kitchen', 'Bathroom'],
    averageProjectSize: 45000,
    notes: 'Great for mid-size cash jobs.',
    priorityScore: 75,
  },
];

async function main() {
  console.log('🌱 Seeding database…\n');

  for (const u of USERS) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { id: u.id },
      update: { name: u.name, email: u.email, role: u.role, avatarInitial: u.avatarInitial, avatarUrl: u.avatarUrl, passwordHash, active: true },
      create: { id: u.id, name: u.name, email: u.email, role: u.role, avatarInitial: u.avatarInitial, avatarUrl: u.avatarUrl, passwordHash, active: true },
    });
    console.log(`✓ User: ${u.name} — ${u.email} / ${u.password}`);
  }

  for (const c of CONTRACTORS) {
    await prisma.contractor.upsert({
      where: { id: c.id },
      update: c,
      create: c,
    });
    console.log(`✓ Contractor: ${c.companyName}`);
  }

  console.log('\n✅ Seed complete!\n');
  console.log('Login credentials:');
  console.log('  Sabah (admin):  sabahohs@gmail.com / admin123');
  console.log('  Oliver (rep):   David.galaxykitchenrenovation@gmail.com / oliver123');
  console.log('  Xavier (rep):   kb.live13@gmail.com / xavier123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
