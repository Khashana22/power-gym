/**
 * Prisma Seed Script
 *
 * Run with: npx prisma db seed
 * Or:       npx tsx prisma/seed.ts
 *
 * Creates:
 *   - 1 Gym (Power Gym)
 *   - 1 Owner user  (admin@powergym.com / Admin123!)
 *   - 3 MembershipPlans (Monthly, Quarterly, Annual)
 */

import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  /* ── Gym ──────────────────────────────────────────────── */
  const gym = await prisma.gym.upsert({
    where: { id: 'seed-gym-001' },
    update: {},
    create: {
      id: 'seed-gym-001',
      name: 'POWER GYM',
      phone: '01559666564',
      address: '123 Fitness Street, Cairo, Egypt',
    },
  });
  console.log(`✅ Gym created: ${gym.name}`);

  /* ── Owner user ───────────────────────────────────────── */
  const hashedPassword = await argon2.hash('Admin123!');

  const owner = await prisma.user.upsert({
    where: { email: 'admin@powergym.com' },
    update: {},
    create: {
      fullName: 'Gym Admin',
      email: 'admin@powergym.com',
      password: hashedPassword,
      role: 'OWNER',
      gymId: gym.id,
    },
  });
  console.log(`✅ Owner created: ${owner.email}`);

  /* ── Membership Plans ─────────────────────────────────── */
  const plans = [
    { name: 'Monthly',   durationDays: 30,  price: 250 },
    { name: 'Quarterly', durationDays: 90,  price: 650 },
    { name: 'Annual',    durationDays: 365, price: 2200 },
  ];

  for (const plan of plans) {
    const created = await prisma.membershipPlan.create({
      data: {
        ...plan,
        gymId: gym.id,
      },
    }).catch(() => null); // Ignore if already exists (no unique constraint on name)

    if (created) {
      console.log(`✅ Plan created: ${plan.name} (${plan.durationDays} days / ${plan.price} EGP)`);
    }
  }

  console.log('\n🎉 Seed complete!');
  console.log('   Login: admin@powergym.com / Admin123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
